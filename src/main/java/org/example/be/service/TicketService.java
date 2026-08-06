package org.example.be.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.example.be.dto.ConcessionLineDTO;
import org.example.be.dto.TicketDetailDTO;
import org.example.be.entity.*;
import org.example.be.enums.TicketStatus;
import org.example.be.repository.*;
import org.example.be.util.SeatLabelUtil;
import org.example.be.util.TicketCodeGenerator;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketService {

    private static final int MAX_CODE_GENERATION_ATTEMPTS = 5;
    private static final int CHECK_IN_WINDOW_MINUTES = 30;

    private final TicketRepository ticketRepository;
    private final InvoiceRepository invoiceRepository;
    private final ScheduleRepository scheduleRepository;
    private final MovieRepository movieRepository;
    private final CinemaRoomRepository cinemaRoomRepository;
    private final InvoiceSeatRepository invoiceSeatRepository;
    private final ScheduleSeatRepository scheduleSeatRepository;
    private final SeatRepository seatRepository;
    private final AccountRepository accountRepository;
    private final InvoiceConcessionRepository invoiceConcessionRepository;

    @Transactional
    public boolean createTicketForPaidInvoice(Integer invoiceId) {
        if (ticketRepository.existsByInvoiceId(invoiceId)) {
            return false;
        }

        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new EntityNotFoundException("Invoice not found: " + invoiceId));
        if (invoice.getStatus() == null || invoice.getStatus() != 1) {
            throw new IllegalStateException("Cannot create a ticket for an invoice that is not paid: " + invoiceId);
        }

        String createdBy = invoice.getSoldByAccountId() != null
                ? invoice.getSoldByAccountId() : invoice.getAccountId();

        for (int attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt++) {
            Ticket ticket = Ticket.builder()
                    .invoiceId(invoiceId)
                    .ticketCode(TicketCodeGenerator.generate())
                    .createdBy(createdBy)
                    .build();
            try {
                ticketRepository.save(ticket);
                return true;
            } catch (DataIntegrityViolationException e) {
                if (ticketRepository.existsByInvoiceId(invoiceId)) {
                    return false;
                }
            }
        }
        throw new IllegalStateException("Failed to generate a unique ticket code after "
                + MAX_CODE_GENERATION_ATTEMPTS + " attempts for invoice: " + invoiceId);
    }

    @Transactional
    public int expireEndedShowtimeTickets() {
        return ticketRepository.expireValidTicketsForEndedSchedules(LocalDateTime.now());
    }

    @Transactional(readOnly = true)
    public TicketDetailDTO getTicketDetailByCode(String ticketCode) {
        Ticket ticket = ticketRepository.findByTicketCode(ticketCode)
                .orElseThrow(() -> new EntityNotFoundException("Ticket code not found: " + ticketCode));
        Invoice invoice = invoiceRepository.findById(ticket.getInvoiceId())
                .orElseThrow(() -> new EntityNotFoundException("Invoice not found: " + ticket.getInvoiceId()));
        return buildDetail(ticket, invoice);
    }

    @Transactional
    public TicketDetailDTO checkIn(String ticketCode) {
        String employeeAccountId = getLoggedInEmployeeAccountId();
        Ticket ticket = ticketRepository.findByTicketCode(ticketCode)
                .orElseThrow(() -> new EntityNotFoundException("Ticket code not found: " + ticketCode));
        Invoice invoice = invoiceRepository.findById(ticket.getInvoiceId())
                .orElseThrow(() -> new EntityNotFoundException("Invoice not found: " + ticket.getInvoiceId()));

        if (ticket.getStatus() == TicketStatus.CANCELLED || invoice.getStatus() == 2) {
            throw new IllegalStateException("Vé này đã bị hủy.");
        }
        if (ticket.getStatus() == TicketStatus.EXPIRED) {
            throw new IllegalStateException("Vé này đã hết hạn vì suất chiếu đã kết thúc.");
        }
        if (invoice.getStatus() == null || invoice.getStatus() != 1) {
            throw new IllegalStateException("Hóa đơn này chưa được thanh toán.");
        }
        if (ticket.getStatus() == TicketStatus.CHECKED_IN) {
            throw new IllegalStateException("Vé này đã được check-in lúc " + ticket.getCheckedInAt());
        }

        LocalDateTime now = LocalDateTime.now();
        Schedule schedule = scheduleRepository.findById(invoice.getScheduleId()).orElse(null);
        if (schedule != null && schedule.getStartTime() != null) {
            LocalDateTime earliestCheckInTime = schedule.getStartTime().minusMinutes(CHECK_IN_WINDOW_MINUTES);
            if (now.isBefore(earliestCheckInTime)) {
                throw new IllegalStateException("Chưa đến giờ check-in. Chỉ được check-in trong vòng "
                        + CHECK_IN_WINDOW_MINUTES + " phút trước giờ chiếu (suất chiếu bắt đầu lúc " + schedule.getStartTime() + ").");
            }
        }

        int updated = ticketRepository.markCheckedIn(ticketCode, now, employeeAccountId);
        if (updated == 0) {
            Ticket refreshed = ticketRepository.findByTicketCode(ticketCode)
                    .orElseThrow(() -> new EntityNotFoundException("Ticket code not found: " + ticketCode));
            throw new IllegalStateException("Vé này đã được check-in lúc " + refreshed.getCheckedInAt());
        }

        Ticket updatedTicket = ticketRepository.findByTicketCode(ticketCode)
                .orElseThrow(() -> new EntityNotFoundException("Ticket code not found: " + ticketCode));
        return buildDetail(updatedTicket, invoice);
    }

    public TicketDetailDTO buildDetail(Ticket ticket, Invoice invoice) {
        Schedule schedule = scheduleRepository.findById(invoice.getScheduleId()).orElse(null);
        Movie movie = schedule != null ? movieRepository.findById(schedule.getMovieId()).orElse(null) : null;
        CinemaRoom room = schedule != null && schedule.getCinemaRoomId() != null
                ? cinemaRoomRepository.findById(schedule.getCinemaRoomId()).orElse(null) : null;

        List<InvoiceSeat> invoiceSeats = invoiceSeatRepository.findByInvoiceId(invoice.getInvoiceId());
        List<TicketDetailDTO.SeatInfoDTO> seatInfos = new ArrayList<>();
        for (InvoiceSeat is : invoiceSeats) {
            ScheduleSeat ss = scheduleSeatRepository.findById(is.getScheduleSeatId()).orElse(null);
            Seat seat = ss != null ? seatRepository.findById(ss.getSeatId()).orElse(null) : null;
            if (seat != null) {
                seatInfos.add(TicketDetailDTO.SeatInfoDTO.builder()
                        .seatLabel(SeatLabelUtil.formatSeatLabel(seat))
                        .seatType(seat.getSeatType())
                        .price(is.getPrice())
                        .build());
            }
        }

        List<ConcessionLineDTO> concessions = invoiceConcessionRepository.findByInvoiceId(invoice.getInvoiceId())
                .stream()
                .map(line -> ConcessionLineDTO.builder()
                        .itemName(line.getItemName())
                        .size(line.getSize().name())
                        .unitPrice(line.getUnitPrice())
                        .quantity(line.getQuantity())
                        .lineTotal(line.getLineTotal())
                        .build())
                .collect(Collectors.toList());

        String movieName = movie != null
                ? (movie.getMovieNameVn() != null ? movie.getMovieNameVn() : movie.getMovieNameEnglish())
                : null;

        String accountEmail = null;
        if (invoice.getAccountId() != null) {
            Optional<Account> account = accountRepository.findById(invoice.getAccountId());
            accountEmail = account.map(Account::getEmail).orElse(null);
        }

        return TicketDetailDTO.builder()
                .ticketId(ticket.getTicketId())
                .invoiceId(invoice.getInvoiceId())
                .ticketCode(ticket.getTicketCode())
                .movieName(movieName)
                .moviePosterUrl(movie != null ? movie.getSmallImage() : null)
                .roomName(room != null ? room.getCinemaRoomName() : null)
                .showtime(schedule != null ? schedule.getStartTime() : null)
                .ticketCount(seatInfos.size())
                .seats(seatInfos)
                .concessions(concessions)
                .totalMoney(invoice.getTotalMoney())
                .useScore(invoice.getUseScore())
                .invoiceStatus(invoice.getStatus())
                .status(ticket.getStatus())
                .checkedInAt(ticket.getCheckedInAt())
                .checkedInBy(ticket.getCheckedInBy())
                .cancelledAt(ticket.getCancelledAt())
                .accountEmail(accountEmail)
                .build();
    }

    private String getLoggedInEmployeeAccountId() {
        org.springframework.security.core.Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new IllegalStateException("Nhân viên phải đăng nhập để thực hiện check-in vé.");
        }
        String username = auth.getPrincipal().toString();
        Account account = accountRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy tài khoản nhân viên đang đăng nhập."));
        return account.getAccountId();
    }
}
