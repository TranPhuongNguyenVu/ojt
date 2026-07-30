package org.example.be.service;

import org.example.be.dto.SeatResponseDTO;
import org.example.be.dto.ConfirmPaymentRequest;
import org.example.be.dto.SeatHoldResponseDTO;
import org.example.be.dto.BookingHistoryResponseDTO;
import org.example.be.dto.PointsHistoryResponseDTO;
import org.example.be.dto.EmployeeConfirmBookingRequest;
import org.example.be.dto.EmployeeBookingDetailDTO;
import org.example.be.dto.EmployeeSalesHistoryDTO;
import org.example.be.entity.*;
import org.example.be.enums.ScheduleStatus;
import org.example.be.repository.*;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class BookingService {

    @Autowired
    private ScheduleRepository scheduleRepository;

    @Autowired
    private SeatRepository seatRepository;

    @Autowired
    private ScheduleSeatRepository scheduleSeatRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private InvoiceSeatRepository invoiceSeatRepository;

    @Autowired
    private ScoreTransactionRepository scoreTransactionRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private CinemaRoomRepository cinemaRoomRepository;

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private PricingService pricingService;

    @Autowired
    private SeatRealtimeService seatRealtimeService;

    private static final int DRAFT_HOLD_MINUTES = 3;

    @Transactional
    public List<SeatResponseDTO> getSeatsBySchedule(Integer scheduleId) {
        releaseExpiredHoldsForSchedule(scheduleId);

        Schedule schedule = scheduleRepository
                .findByScheduleIdAndStatusNotIn(scheduleId, List.of(ScheduleStatus.CANCELLED, ScheduleStatus.DELETED))
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy suất chiếu ID: " + scheduleId));

        List<Seat> physicalSeats = seatRepository.findByCinemaRoomId(schedule.getCinemaRoomId());
        List<ScheduleSeat> bookedSeats = scheduleSeatRepository.findByScheduleId(scheduleId);
        java.util.Map<Integer, java.math.BigDecimal> seatPrices = pricingService.calculatePrices(schedule, physicalSeats);

        return physicalSeats.stream()
                .filter(seat -> !Seat.STATUS_AISLE.equals(seat.getStatus()))
                .map(seat -> {
                    Optional<ScheduleSeat> matched = bookedSeats.stream()
                            .filter(bs -> bs.getSeatId().equals(seat.getSeatId())
                                    && bs.getSeatStatus() != null
                                    && (bs.getSeatStatus() == ScheduleSeat.STATUS_BOOKED
                                        || bs.getSeatStatus() == ScheduleSeat.STATUS_DRAFT))
                            .findFirst();

                    int bookingStatus = matched.map(ScheduleSeat::getSeatStatus).orElse(ScheduleSeat.STATUS_AVAILABLE);

                    return SeatResponseDTO.builder()
                            .seatId(seat.getSeatId())
                            .seatColumn(seat.getSeatColumn())
                            .seatRow(seat.getSeatRow())
                            .seatType(seat.getSeatType())
                            .status(seat.getStatus())
                            .bookingStatus(bookingStatus)
                            .price(seatPrices.get(seat.getSeatId()))
                            .reservedAt(matched.map(ScheduleSeat::getReservedAt).orElse(null))
                            .reservedBy(matched.map(ScheduleSeat::getReservedBy).orElse(null))
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Integer getMemberScore() {
        Account account = getLoggedInAccount();
        if (account == null) return 0;

        Member member = memberRepository.findByAccountAccountId(account.getAccountId()).orElse(null);
        return member != null ? member.getScore() : 0;
    }

    /**
     * Giữ ghế ở trạng thái DRAFT. Trả về reservedBy để FE gắn đúng tab đang giữ.
     */
    @Transactional
    public SeatHoldResponseDTO confirmBooking(Integer scheduleId, List<Integer> seatIds) {
        releaseExpiredHoldsForSchedule(scheduleId);
        return holdSeatsAsDraft(scheduleId, seatIds);
    }

    /**
     * Chỉ kiểm tra ghế còn bookable (trống hoặc DRAFT của chính mình).
     */
    private void assertSeatsBookable(Integer scheduleId, List<Integer> seatIds) {
        releaseExpiredHoldsForSchedule(scheduleId);
        Account account = getLoggedInAccount();
        String accountId = account != null ? account.getAccountId() : null;

        for (Integer seatId : seatIds) {
            Optional<ScheduleSeat> existing = scheduleSeatRepository.findByScheduleIdAndSeatId(scheduleId, seatId);
            if (existing.isEmpty()) {
                continue;
            }
            ScheduleSeat ss = existing.get();
            Integer status = ss.getSeatStatus();
            if (status != null && status == ScheduleSeat.STATUS_BOOKED) {
                throw new IllegalStateException("Ghế này đã có người đặt trước! Vui lòng chọn ghế khác.");
            }
            if (status != null && status == ScheduleSeat.STATUS_DRAFT) {
                if (accountId == null || !accountId.equals(ss.getReservedBy())) {
                    throw new IllegalStateException("Ghế này đang được người khác giữ! Vui lòng chọn ghế khác.");
                }
            }
        }
    }

    private SeatHoldResponseDTO holdSeatsAsDraft(Integer scheduleId, List<Integer> seatIds) {
        Account account = getLoggedInAccount();
        String accountId = account != null ? account.getAccountId() : null;
        if (accountId == null) {
            throw new IllegalStateException("Vui lòng đăng nhập để giữ ghế.");
        }
        if (seatIds == null || seatIds.isEmpty()) {
            throw new IllegalArgumentException("Danh sách ghế trống.");
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiredBefore = now.minusMinutes(DRAFT_HOLD_MINUTES);
        // Sắp xếp ID để tránh deadlock khi 2 user giữ nhiều ghế giao nhau
        List<Integer> orderedSeatIds = seatIds.stream().distinct().sorted().toList();

        for (Integer seatId : orderedSeatIds) {
            if (!tryHoldSeatAtomic(scheduleId, seatId, accountId, now, expiredBefore)) {
                throw new IllegalStateException(
                        "Ghế này đang được người khác giữ hoặc đã đặt! Vui lòng chọn ghế khác.");
            }
        }

        seatRealtimeService.broadcastSeatStatus(
                scheduleId, orderedSeatIds, ScheduleSeat.STATUS_DRAFT, accountId, now);

        return SeatHoldResponseDTO.builder()
                .seatIds(orderedSeatIds)
                .reservedBy(accountId)
                .reservedAt(now)
                .bookingStatus(ScheduleSeat.STATUS_DRAFT)
                .build();
    }

    /**
     * Giữ ghế an toàn dưới concurrent load:
     * 1) UPDATE có điều kiện (trống / DRAFT của mình / DRAFT hết hạn)
     * 2) Nếu chưa có dòng → INSERT; race insert → UNIQUE bắt và thử UPDATE lại
     */
    private boolean tryHoldSeatAtomic(
            Integer scheduleId,
            Integer seatId,
            String accountId,
            LocalDateTime now,
            LocalDateTime expiredBefore) {

        int updated = scheduleSeatRepository.tryHoldSeat(scheduleId, seatId, accountId, now, expiredBefore);
        if (updated > 0) {
            return true;
        }

        Optional<ScheduleSeat> existing = scheduleSeatRepository.findByScheduleIdAndSeatIdForUpdate(scheduleId, seatId);
        if (existing.isPresent()) {
            ScheduleSeat ss = existing.get();
            Integer status = ss.getSeatStatus();
            if (status != null && status == ScheduleSeat.STATUS_BOOKED) {
                return false;
            }
            if (status != null && status == ScheduleSeat.STATUS_DRAFT) {
                boolean own = accountId.equals(ss.getReservedBy());
                boolean expired = ss.getReservedAt() != null && ss.getReservedAt().isBefore(expiredBefore);
                if (!own && !expired) {
                    return false;
                }
            }
            ss.setSeatStatus(ScheduleSeat.STATUS_DRAFT);
            ss.setReservedAt(now);
            ss.setReservedBy(accountId);
            scheduleSeatRepository.saveAndFlush(ss);
            return true;
        }

        try {
            ScheduleSeat created = ScheduleSeat.builder()
                    .scheduleId(scheduleId)
                    .seatId(seatId)
                    .seatStatus(ScheduleSeat.STATUS_DRAFT)
                    .reservedAt(now)
                    .reservedBy(accountId)
                    .build();
            scheduleSeatRepository.saveAndFlush(created);
            return true;
        } catch (DataIntegrityViolationException ex) {
            // User khác vừa INSERT cùng ghế → thử cướp bằng UPDATE điều kiện
            return scheduleSeatRepository.tryHoldSeat(scheduleId, seatId, accountId, now, expiredBefore) > 0;
        }
    }

    /**
     * Nhả ghế DRAFT của chính người đang giữ (thoát trang thanh toán / hủy chọn).
     */
    @Transactional
    public void releaseSeats(Integer scheduleId, List<Integer> seatIds) {
        if (seatIds == null || seatIds.isEmpty()) {
            return;
        }

        Account account = getLoggedInAccount();
        String accountId = account != null ? account.getAccountId() : null;
        List<Integer> released = new ArrayList<>();

        for (Integer seatId : seatIds) {
            scheduleSeatRepository.findByScheduleIdAndSeatId(scheduleId, seatId).ifPresent(ss -> {
                if (ss.getSeatStatus() != null
                        && ss.getSeatStatus() == ScheduleSeat.STATUS_DRAFT
                        && accountId != null
                        && accountId.equals(ss.getReservedBy())) {
                    ss.setSeatStatus(ScheduleSeat.STATUS_AVAILABLE);
                    ss.setReservedAt(null);
                    ss.setReservedBy(null);
                    scheduleSeatRepository.save(ss);
                    released.add(seatId);
                }
            });
        }

        if (!released.isEmpty()) {
            seatRealtimeService.broadcastSeatStatus(scheduleId, released, ScheduleSeat.STATUS_AVAILABLE);
        }
    }

    private void unlockScheduleSeats(List<InvoiceSeat> invoiceSeats) {
        if (invoiceSeats == null || invoiceSeats.isEmpty()) {
            return;
        }

        Integer scheduleId = null;
        List<Integer> releasedSeatIds = new ArrayList<>();

        for (InvoiceSeat is : invoiceSeats) {
            ScheduleSeat ss = scheduleSeatRepository.findById(is.getScheduleSeatId()).orElse(null);
            if (ss != null) {
                scheduleId = ss.getScheduleId();
                ss.setSeatStatus(ScheduleSeat.STATUS_AVAILABLE);
                ss.setReservedAt(null);
                ss.setReservedBy(null);
                scheduleSeatRepository.save(ss);
                releasedSeatIds.add(ss.getSeatId());
            }
        }

        if (scheduleId != null && !releasedSeatIds.isEmpty()) {
            seatRealtimeService.broadcastSeatStatus(scheduleId, releasedSeatIds, ScheduleSeat.STATUS_AVAILABLE);
        }
    }

    private void releaseExpiredHoldsForSchedule(Integer scheduleId) {
        try {
            LocalDateTime threshold = LocalDateTime.now().minusMinutes(DRAFT_HOLD_MINUTES);
            List<Invoice> expiredInvoices = invoiceRepository.findByScheduleIdAndStatusAndBookingDateBefore(
                    scheduleId, 0, threshold);
            for (Invoice invoice : expiredInvoices) {
                failMomoPayment(invoice.getInvoiceId());
            }
            releaseExpiredDraftSeats(threshold);
        } catch (Exception e) {
            System.err.println("Lỗi giải phóng ghế hết hạn: " + e.getMessage());
        }
    }

    /**
     * Giải phóng ghế DRAFT quá hạn (không còn / không gắn invoice pending).
     */
    @Transactional
    public void releaseExpiredDraftSeats() {
        releaseExpiredDraftSeats(LocalDateTime.now().minusMinutes(DRAFT_HOLD_MINUTES));
    }

    private void releaseExpiredDraftSeats(LocalDateTime threshold) {
        List<ScheduleSeat> expired = scheduleSeatRepository
                .findBySeatStatusAndReservedAtBefore(ScheduleSeat.STATUS_DRAFT, threshold);
        if (expired.isEmpty()) {
            return;
        }

        java.util.Map<Integer, List<Integer>> bySchedule = new java.util.HashMap<>();
        for (ScheduleSeat ss : expired) {
            boolean linkedToPendingInvoice = invoiceSeatRepository
                    .findByScheduleSeatId(ss.getScheduleSeatId())
                    .stream()
                    .map(InvoiceSeat::getInvoiceId)
                    .map(invoiceRepository::findById)
                    .filter(Optional::isPresent)
                    .map(Optional::get)
                    .anyMatch(inv -> inv.getStatus() != null && inv.getStatus() == 0);

            // Ghế gắn hóa đơn chờ thanh toán: để luồng fail invoice xử lý
            if (linkedToPendingInvoice) {
                continue;
            }

            ss.setSeatStatus(ScheduleSeat.STATUS_AVAILABLE);
            ss.setReservedAt(null);
            ss.setReservedBy(null);
            scheduleSeatRepository.save(ss);
            bySchedule.computeIfAbsent(ss.getScheduleId(), k -> new ArrayList<>()).add(ss.getSeatId());
        }

        bySchedule.forEach((scheduleId, seatIds) ->
                seatRealtimeService.broadcastSeatStatus(scheduleId, seatIds, ScheduleSeat.STATUS_AVAILABLE));
    }

    @Transactional
    public EmployeeBookingDetailDTO createEmployeeBooking(Integer scheduleId, EmployeeConfirmBookingRequest request) {
        if (request.getSeatIds() == null || request.getSeatIds().isEmpty()) {
            throw new IllegalArgumentException("Incomplete booking data. Please return and complete seat selection.");
        }

        assertSeatsBookable(scheduleId, request.getSeatIds());

        int pointsToUse = request.getPointsToUse() != null ? request.getPointsToUse() : 0;
        if (pointsToUse < 0) {
            throw new IllegalArgumentException("Invalid number of points to use.");
        }
        if (pointsToUse > 0 && (request.getMemberId() == null || request.getMemberId().isBlank())) {
            throw new IllegalArgumentException("Member is required to use score.");
        }

        Member member = null;
        if (request.getMemberId() != null && !request.getMemberId().isBlank()) {
            member = memberRepository.findByIdWithAccount(request.getMemberId())
                    .orElseThrow(() -> new IllegalArgumentException("No member has found!"));
        }

        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy suất chiếu ID: " + scheduleId));

        List<SeatPriceEntry> seatPrices = new ArrayList<>();
        for (Integer seatId : request.getSeatIds()) {
            Seat seat = seatRepository.findById(seatId)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy ghế ID: " + seatId));
            double price = pricingService.calculatePrice(schedule, seat).doubleValue();
            seatPrices.add(new SeatPriceEntry(seat, price));
        }

        seatPrices.sort(Comparator.comparingDouble(SeatPriceEntry::price));

        double totalSeatPrice = seatPrices.stream().mapToDouble(SeatPriceEntry::price).sum();
        double concessionTotal = request.getConcessionTotal() != null
                ? Math.max(0, request.getConcessionTotal())
                : 0;
        double orderSubtotal = totalSeatPrice + concessionTotal;
        int maxPointsByTotal = (int) Math.floor(orderSubtotal / 1000.0);
        if (pointsToUse > maxPointsByTotal) {
            throw new IllegalArgumentException("Points exceed the maximum allowed for this booking.");
        }
        if (member != null && pointsToUse > member.getScore()) {
            throw new IllegalArgumentException("Member score is not enough.");
        }

        int useScore = pointsToUse;
        double totalMoney = orderSubtotal - pointsToUse * 1000.0;
        List<EmployeeBookingDetailDTO.SeatPriceDTO> seatPriceDTOs = new ArrayList<>();

        for (SeatPriceEntry entry : seatPrices) {
            seatPriceDTOs.add(EmployeeBookingDetailDTO.SeatPriceDTO.builder()
                    .seatLabel(formatSeatLabel(entry.seat()))
                    .price(entry.price())
                    .convertedByScore(false)
                    .build());
        }

        int addScore = member != null ? (int) (totalMoney * 0.05 / 1000) : 0;

        String accountId = member != null && member.getAccount() != null
                ? member.getAccount().getAccountId()
                : null;

        Account sellingEmployee = getLoggedInAccount();
        if (sellingEmployee == null) {
            throw new IllegalStateException("Vui lòng đăng nhập để bán vé tại quầy.");
        }
        String soldByAccountId = sellingEmployee.getAccountId();

        Invoice invoice = Invoice.builder()
                .accountId(accountId)
                .soldByAccountId(soldByAccountId)
                .scheduleId(scheduleId)
                .bookingDate(LocalDateTime.now())
                .totalMoney(totalMoney)
                .useScore(useScore)
                .addScore(addScore)
                .status(1)
                .build();
        invoice = invoiceRepository.save(invoice);

        if (member != null) {
            int currentScore = member.getScore();
            if (useScore > 0) {
                currentScore -= useScore;
                member.setScore(currentScore);
                memberRepository.save(member);

                ScoreTransaction subTx = ScoreTransaction.builder()
                        .memberId(member.getMemberId())
                        .invoiceId(invoice.getInvoiceId())
                        .txnType("SUB")
                        .points(useScore)
                        .balanceAfter((double) currentScore)
                        .txnDate(LocalDateTime.now())
                        .build();
                scoreTransactionRepository.save(subTx);
            }
            if (addScore > 0) {
                currentScore += addScore;
                member.setScore(currentScore);
                memberRepository.save(member);

                ScoreTransaction addTx = ScoreTransaction.builder()
                        .memberId(member.getMemberId())
                        .invoiceId(invoice.getInvoiceId())
                        .txnType("ADD")
                        .points(addScore)
                        .balanceAfter((double) currentScore)
                        .txnDate(LocalDateTime.now())
                        .build();
                scoreTransactionRepository.save(addTx);
            }
        }

        for (SeatPriceEntry entry : seatPrices) {
            Integer seatId = entry.seat().getSeatId();
            ScheduleSeat scheduleSeat = scheduleSeatRepository.findByScheduleIdAndSeatId(scheduleId, seatId)
                    .orElse(null);

            if (scheduleSeat == null) {
                scheduleSeat = ScheduleSeat.builder()
                        .scheduleId(scheduleId)
                        .seatId(seatId)
                        .build();
            }
            scheduleSeat.setSeatStatus(ScheduleSeat.STATUS_BOOKED);
            scheduleSeat = scheduleSeatRepository.save(scheduleSeat);

            InvoiceSeat invoiceSeat = InvoiceSeat.builder()
                    .invoiceId(invoice.getInvoiceId())
                    .scheduleSeatId(scheduleSeat.getScheduleSeatId())
                    .price(entry.price())
                    .build();
            invoiceSeatRepository.save(invoiceSeat);
        }

        seatRealtimeService.broadcastSeatStatus(
                scheduleId,
                request.getSeatIds(),
                ScheduleSeat.STATUS_BOOKED);

        Payment payment = Payment.builder()
                .invoiceId(invoice.getInvoiceId())
                .txnRef("EMP-" + System.currentTimeMillis())
                .paymentMethod("CASH")
                .amount(totalMoney)
                .paymentStatus("SUCCESS")
                .createdAt(LocalDateTime.now())
                .build();
        paymentRepository.save(payment);

        return buildEmployeeBookingDetail(invoice);
    }

    @Transactional(readOnly = true)
    public EmployeeBookingDetailDTO getEmployeeBookingDetail(Integer invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hóa đơn ID: " + invoiceId));
        return buildEmployeeBookingDetail(invoice);
    }

    @Transactional(readOnly = true)
    public List<EmployeeSalesHistoryDTO> getEmployeeSalesHistory() {
        List<Payment> payments = paymentRepository.findEmployeeCounterPayments();

        return payments.stream()
                .map(payment -> {
                    Invoice invoice = invoiceRepository.findById(payment.getInvoiceId()).orElse(null);
                    if (invoice == null) {
                        return null;
                    }

                    Schedule schedule = scheduleRepository.findById(invoice.getScheduleId()).orElse(null);
                    Movie movie = schedule != null ? movieRepository.findById(schedule.getMovieId()).orElse(null) : null;
                    CinemaRoom room = schedule != null && schedule.getCinemaRoomId() != null
                            ? cinemaRoomRepository.findById(schedule.getCinemaRoomId()).orElse(null) : null;

                    List<InvoiceSeat> invoiceSeats = invoiceSeatRepository.findByInvoiceId(invoice.getInvoiceId());
                    String seatsLabel = invoiceSeats.stream()
                            .map(is -> {
                                ScheduleSeat ss = scheduleSeatRepository.findById(is.getScheduleSeatId()).orElse(null);
                                Seat seat = ss != null ? seatRepository.findById(ss.getSeatId()).orElse(null) : null;
                                if (seat == null) {
                                    return null;
                                }
                                return formatSeatLabel(seat);
                            })
                            .filter(java.util.Objects::nonNull)
                            .collect(Collectors.joining(", "));

                    Member member = null;
                    if (invoice.getAccountId() != null) {
                        member = memberRepository.findByAccountAccountId(invoice.getAccountId()).orElse(null);
                    }

                    // Luôn lấy tên account người bán (người login lúc tạo hóa đơn)
                    String soldByEmployeeName = null;
                    if (invoice.getSoldByAccountId() != null) {
                        soldByEmployeeName = accountRepository.findById(invoice.getSoldByAccountId())
                                .map(seller -> {
                                    if (seller.getFullName() != null && !seller.getFullName().isBlank()) {
                                        return seller.getFullName();
                                    }
                                    return seller.getUsername();
                                })
                                .orElse(null);
                    }

                    // Có thành viên → hiện tên KH; khách lẻ → hiện tên người bán
                    String customerName = member != null && member.getAccount() != null
                            ? member.getAccount().getFullName()
                            : (soldByEmployeeName != null ? soldByEmployeeName : "Khách lẻ");

                    String movieName = movie != null
                            ? (movie.getMovieNameVn() != null ? movie.getMovieNameVn() : movie.getMovieNameEnglish())
                            : "Phim";

                    return EmployeeSalesHistoryDTO.builder()
                            .invoiceId(invoice.getInvoiceId())
                            .movieName(movieName)
                            .screen(room != null ? room.getCinemaRoomName() : "Phòng chiếu")
                            .showtime(schedule != null ? schedule.getStartTime() : null)
                            .bookingDate(invoice.getBookingDate() != null ? invoice.getBookingDate() : payment.getCreatedAt())
                            .seats(seatsLabel)
                            .totalMoney(invoice.getTotalMoney())
                            .useScore(invoice.getUseScore())
                            .addScore(invoice.getAddScore())
                            .memberFullName(customerName)
                            .soldByEmployeeName(soldByEmployeeName)
                            .phoneNumber(member != null && member.getAccount() != null
                                    ? member.getAccount().getPhoneNumber() : null)
                            .paymentMethod(payment.getPaymentMethod())
                            .build();
                })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());
    }

    private EmployeeBookingDetailDTO buildEmployeeBookingDetail(Invoice invoice) {
        Schedule schedule = scheduleRepository.findById(invoice.getScheduleId()).orElse(null);
        Movie movie = schedule != null ? movieRepository.findById(schedule.getMovieId()).orElse(null) : null;
        CinemaRoom room = schedule != null && schedule.getCinemaRoomId() != null
                ? cinemaRoomRepository.findById(schedule.getCinemaRoomId()).orElse(null) : null;

        List<InvoiceSeat> invoiceSeats = invoiceSeatRepository.findByInvoiceId(invoice.getInvoiceId());

        List<EmployeeBookingDetailDTO.SeatPriceDTO> seatPriceDTOs = new ArrayList<>();
        List<String> seatLabels = new ArrayList<>();

        List<SeatPriceEntry> entries = new ArrayList<>();
        for (InvoiceSeat is : invoiceSeats) {
            ScheduleSeat ss = scheduleSeatRepository.findById(is.getScheduleSeatId()).orElse(null);
            Seat seat = ss != null ? seatRepository.findById(ss.getSeatId()).orElse(null) : null;
            if (seat != null) {
                double price = is.getPrice() != null ? is.getPrice()
                        : (schedule != null ? pricingService.calculatePrice(schedule, seat).doubleValue() : 0.0);
                entries.add(new SeatPriceEntry(seat, price));
            }
        }
        entries.sort(Comparator.comparingDouble(SeatPriceEntry::price));

        for (SeatPriceEntry entry : entries) {
            String label = formatSeatLabel(entry.seat());
            seatLabels.add(label);
            seatPriceDTOs.add(EmployeeBookingDetailDTO.SeatPriceDTO.builder()
                    .seatLabel(label)
                    .price(entry.price())
                    .convertedByScore(false)
                    .build());
        }

        Member member = null;
        if (invoice.getAccountId() != null) {
            member = memberRepository.findByAccountAccountId(invoice.getAccountId()).orElse(null);
        }

        String movieName = movie != null
                ? (movie.getMovieNameVn() != null ? movie.getMovieNameVn() : movie.getMovieNameEnglish())
                : "Phim";

        return EmployeeBookingDetailDTO.builder()
                .invoiceId(invoice.getInvoiceId())
                .movieName(movieName)
                .screen(room != null ? room.getCinemaRoomName() : "Phòng chiếu")
                .showtime(schedule != null ? schedule.getStartTime() : null)
                .seats(String.join(", ", seatLabels))
                .seatPrices(seatPriceDTOs)
                .totalMoney(invoice.getTotalMoney())
                .ticketsConverted(0)
                .useScore(invoice.getUseScore())
                .addScore(invoice.getAddScore())
                .memberId(member != null ? member.getMemberId() : null)
                .memberFullName(member != null && member.getAccount() != null ? member.getAccount().getFullName() : null)
                .identityCard(member != null && member.getAccount() != null ? member.getAccount().getIdentityCard() : null)
                .phoneNumber(member != null && member.getAccount() != null ? member.getAccount().getPhoneNumber() : null)
                .memberScoreAfter(member != null ? member.getScore() : null)
                .build();
    }

    private record SeatPriceEntry(Seat seat, double price) {}

    @Transactional
    public Invoice createInvoiceAndPayment(ConfirmPaymentRequest request) {
        // 1. Kiểm tra tranh chấp trùng ghế trước tiên
        assertSeatsBookable(request.getScheduleId(), request.getSeatIds());

        // Kiểm tra giới hạn sử dụng điểm tối đa 20% giá trị tiền vé
        Schedule scheduleObj = scheduleRepository.findById(request.getScheduleId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy suất chiếu ID: " + request.getScheduleId()));
        double originalTicketSum = 0.0;
        for (Integer seatId : request.getSeatIds()) {
            Seat seat = seatRepository.findById(seatId).orElse(null);
            originalTicketSum += pricingService.calculatePrice(scheduleObj, seat).doubleValue();
        }
        int finalUseScore = request.getUseScore() != null ? request.getUseScore() : 0;
        int maxScoreAllowed = (int) Math.floor((originalTicketSum * 0.20) / 1000.0);
        if (finalUseScore > maxScoreAllowed) {
            throw new IllegalArgumentException("Chỉ được sử dụng tối đa 20% tổng tiền vé để giảm giá (Tối đa: " + maxScoreAllowed + " điểm).");
        }

        // 2. Xác định tài khoản và thông tin thành viên đặt vé
        Account account = getLoggedInAccount();
        if (account == null) {
            throw new IllegalStateException("Vui lòng đăng nhập để thực hiện thanh toán.");
        }

        Member member = memberRepository.findByAccountAccountId(account.getAccountId()).orElse(null);

        // 3. Tính điểm tích lũy mới (5% số tiền thực trả, quy ra điểm: 1 điểm = 1000đ)
        int addScore = (int) (request.getTotalMoney() * 0.05 / 1000);

        // 4. Tạo hóa đơn INVOICE
        Invoice invoice = Invoice.builder()
                .accountId(account.getAccountId())
                .scheduleId(request.getScheduleId())
                .promotionId(request.getPromotionId())
                .bookingDate(LocalDateTime.now())
                .totalMoney(request.getTotalMoney())
                .useScore(request.getUseScore() != null ? request.getUseScore() : 0)
                .addScore(addScore)
                .status(1) // Đã thanh toán (thực tế trả tiền mặt tại quầy)
                .build();

        invoice = invoiceRepository.save(invoice);

        // 5. Cập nhật điểm thành viên (Member) và ghi nhận biến động điểm (ScoreTransaction)
        if (member != null) {
            int currentScore = member.getScore();
            finalUseScore = request.getUseScore() != null ? request.getUseScore() : 0;

            // Kiểm tra tránh dùng âm điểm
            if (finalUseScore > currentScore) {
                throw new IllegalArgumentException("Số điểm sử dụng vượt quá số điểm hiện có.");
            }

            // Trừ điểm đã dùng
            if (finalUseScore > 0) {
                currentScore -= finalUseScore;
                member.setScore(currentScore);
                memberRepository.save(member);

                ScoreTransaction subTx = ScoreTransaction.builder()
                        .memberId(member.getMemberId())
                        .invoiceId(invoice.getInvoiceId())
                        .txnType("SUB")
                        .points(finalUseScore)
                        .balanceAfter((double) currentScore)
                        .txnDate(LocalDateTime.now())
                        .build();
                scoreTransactionRepository.save(subTx);
            }

            // Cộng điểm tích lũy mới
            if (addScore > 0) {
                currentScore += addScore;
                member.setScore(currentScore);
                memberRepository.save(member);

                ScoreTransaction addTx = ScoreTransaction.builder()
                        .memberId(member.getMemberId())
                        .invoiceId(invoice.getInvoiceId())
                        .txnType("ADD")
                        .points(addScore)
                        .balanceAfter((double) currentScore)
                        .txnDate(LocalDateTime.now())
                        .build();
                scoreTransactionRepository.save(addTx);
            }
        }

        // 6. Lưu thông tin chi tiết vé ghế đặt (INVOICE_SEAT) & khóa ghế vĩnh viễn (SCHEDULE_SEAT)
        Schedule schedule = scheduleRepository.findById(request.getScheduleId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy suất chiếu ID: " + request.getScheduleId()));

        for (Integer seatId : request.getSeatIds()) {
            // Khóa ghế trong SCHEDULE_SEAT
            ScheduleSeat scheduleSeat = scheduleSeatRepository.findByScheduleIdAndSeatId(request.getScheduleId(), seatId)
                    .orElse(null);

            if (scheduleSeat == null) {
                scheduleSeat = ScheduleSeat.builder()
                        .scheduleId(request.getScheduleId())
                        .seatId(seatId)
                        .build();
            }
            scheduleSeat.setSeatStatus(ScheduleSeat.STATUS_BOOKED);
            scheduleSeat = scheduleSeatRepository.save(scheduleSeat);

            Seat seat = seatRepository.findById(seatId).orElse(null);
            double actualPrice = pricingService.calculatePrice(schedule, seat).doubleValue();

            // Lưu hóa đơn chi tiết ghế đặt
            InvoiceSeat invoiceSeat = InvoiceSeat.builder()
                    .invoiceId(invoice.getInvoiceId())
                    .scheduleSeatId(scheduleSeat.getScheduleSeatId())
                    .price(actualPrice)
                    .build();
            invoiceSeatRepository.save(invoiceSeat);
        }

        seatRealtimeService.broadcastSeatStatus(
                request.getScheduleId(),
                request.getSeatIds(),
                ScheduleSeat.STATUS_BOOKED);

        // 7. Ghi nhận giao dịch thanh toán (PAYMENT)
        Payment payment = Payment.builder()
                .invoiceId(invoice.getInvoiceId())
                .txnRef("CLX-" + System.currentTimeMillis())
                .paymentMethod(request.getPaymentMethod())
                .amount(request.getTotalMoney())
                .paymentStatus("SUCCESS")
                .createdAt(LocalDateTime.now())
                .build();
        paymentRepository.save(payment);

        return invoice;
    }

    @Transactional(readOnly = true)
    public List<BookingHistoryResponseDTO> getBookingHistory() {
        Account account = getLoggedInAccount();
        if (account == null) {
            return java.util.Collections.emptyList();
        }

        List<Invoice> invoices = invoiceRepository.findByAccountIdOrderByInvoiceIdDesc(account.getAccountId());

        return invoices.stream()
                .map(invoice -> {
                    Schedule schedule = scheduleRepository.findById(invoice.getScheduleId()).orElse(null);
                    Movie movie = schedule != null ? movieRepository.findById(schedule.getMovieId()).orElse(null) : null;
                    CinemaRoom room = schedule != null && schedule.getCinemaRoomId() != null 
                            ? cinemaRoomRepository.findById(schedule.getCinemaRoomId()).orElse(null) : null;

                    // Lấy danh sách ghế đã chọn
                    List<InvoiceSeat> invoiceSeats = invoiceSeatRepository.findByInvoiceId(invoice.getInvoiceId());
                    List<Seat> seats = invoiceSeats.stream()
                            .map(is -> {
                                ScheduleSeat ss = scheduleSeatRepository.findById(is.getScheduleSeatId()).orElse(null);
                                return ss != null ? seatRepository.findById(ss.getSeatId()).orElse(null) : null;
                            })
                            .filter(java.util.Objects::nonNull)
                            .sorted((s1, s2) -> {
                                if (!s1.getSeatRow().equals(s2.getSeatRow())) {
                                    return s1.getSeatRow() - s2.getSeatRow();
                                }
                                try {
                                    return Integer.parseInt(s1.getSeatColumn()) - Integer.parseInt(s2.getSeatColumn());
                                } catch (NumberFormatException e) {
                                    return s1.getSeatColumn().compareTo(s2.getSeatColumn());
                                }
                            })
                            .collect(Collectors.toList());

                    String seatsLabel = seats.stream()
                            .map(this::formatSeatLabel)
                            .collect(Collectors.joining(", "));

                    String movieTitle = movie != null ? (movie.getMovieNameVn() != null ? movie.getMovieNameVn() : movie.getMovieNameEnglish()) : "Phim";
                    String moviePoster = movie != null ? movie.getSmallImage() : null;
                    String roomName = room != null ? room.getCinemaRoomName() : "Phòng chiếu";

                    LocalDateTime showtime = schedule != null ? schedule.getStartTime() : LocalDateTime.now();
                    String status = "completed";
                    String statusText = "Đã xem";
                    if (invoice.getStatus() == 2) {
                        status = "canceled";
                        statusText = "Đã hủy";
                    } else if (invoice.getStatus() == 0) {
                        status = "pending";
                        statusText = "Chờ thanh toán";
                    } else if (showtime.isAfter(LocalDateTime.now())) {
                        status = "upcoming";
                        statusText = "Sắp diễn ra";
                    }

                    return BookingHistoryResponseDTO.builder()
                            .invoiceId(invoice.getInvoiceId())
                            .movieTitle(movieTitle)
                            .moviePoster(moviePoster)
                            .datetime(showtime)
                            .seats(seatsLabel)
                            .cinema(roomName)
                            .totalMoney(invoice.getTotalMoney())
                            .status(status)
                            .statusText(statusText)
                            .addScore(invoice.getAddScore())
                            .useScore(invoice.getUseScore())
                            .build();
                })
                .collect(Collectors.toList());
    }

    private String getRowLetter(Integer rowNum) {
        if (rowNum == null) return "";
        String[] letters = {"A", "B", "C", "D", "E", "F", "G", "H", "I", "J"};
        if (rowNum >= 1 && rowNum <= letters.length) {
            return letters[rowNum - 1];
        }
        return String.valueOf(rowNum);
    }

    /** Match FE getSeatLabel: row letter + column number (A→1, B→2, ...). */
    private int getSeatColumnOrder(String seatColumn) {
        if (seatColumn == null || seatColumn.isBlank()) {
            return 0;
        }
        String raw = seatColumn.trim();
        if (raw.matches("\\d+")) {
            return Integer.parseInt(raw);
        }
        String letter = raw.toUpperCase();
        if (letter.length() == 1 && letter.charAt(0) >= 'A' && letter.charAt(0) <= 'Z') {
            return letter.charAt(0) - 'A' + 1;
        }
        return 0;
    }

    /** Ví dụ: hàng 6 + cột G → F7 */
    private String formatSeatLabel(Seat seat) {
        if (seat == null) {
            return "";
        }
        return getRowLetter(seat.getSeatRow()) + getSeatColumnOrder(seat.getSeatColumn());
    }

    @Transactional(readOnly = true)
    public List<PointsHistoryResponseDTO> getPointsHistory() {
        Account account = getLoggedInAccount();
        if (account == null) {
            return java.util.Collections.emptyList();
        }

        Member member = memberRepository.findByAccountAccountId(account.getAccountId()).orElse(null);
        if (member == null) {
            return java.util.Collections.emptyList();
        }

        List<ScoreTransaction> transactions = scoreTransactionRepository.findByMemberIdOrderByTxnIdDesc(member.getMemberId());

        return transactions.stream()
                .map(tx -> {
                    Invoice invoice = tx.getInvoiceId() != null ? invoiceRepository.findById(tx.getInvoiceId()).orElse(null) : null;
                    Schedule schedule = invoice != null ? scheduleRepository.findById(invoice.getScheduleId()).orElse(null) : null;
                    Movie movie = schedule != null ? movieRepository.findById(schedule.getMovieId()).orElse(null) : null;

                    String movieTitle = movie != null ? (movie.getMovieNameVn() != null ? movie.getMovieNameVn() : movie.getMovieNameEnglish()) : "";
                    
                    String actionText = tx.getTxnType().equals("ADD") ? "Tích điểm phim" : "Dùng điểm mua vé";
                    if (!movieTitle.isEmpty()) {
                        actionText += ": " + movieTitle;
                    }

                    return PointsHistoryResponseDTO.builder()
                            .txnId(tx.getTxnId())
                            .title(actionText)
                            .date(tx.getTxnDate())
                            .points(tx.getPoints())
                            .txnType(tx.getTxnType())
                            .balanceAfter(tx.getBalanceAfter())
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void cancelTicket(Integer invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hóa đơn ID: " + invoiceId));
        
        if (invoice.getStatus() == 2) {
            throw new IllegalStateException("Vé này đã được hủy trước đó.");
        }

        Schedule schedule = scheduleRepository.findById(invoice.getScheduleId()).orElse(null);
        if (schedule != null && schedule.getStartTime().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Không thể hủy vé của suất chiếu đã hoặc đang diễn ra.");
        }
        
        // 1. Cập nhật trạng thái hóa đơn sang Đã hủy (2)
        invoice.setStatus(2);
        invoiceRepository.save(invoice);
        
        // 2. Trả lại điểm thành viên nếu có sử dụng và trừ điểm tích lũy đã cộng
        Account account = getLoggedInAccount();
        if (account != null) {
            Member member = memberRepository.findByAccountAccountId(account.getAccountId()).orElse(null);
            if (member != null) {
                int currentScore = member.getScore();
                
                // Trả lại điểm đã dùng
                if (invoice.getUseScore() != null && invoice.getUseScore() > 0) {
                    currentScore += invoice.getUseScore();
                    ScoreTransaction refundTx = ScoreTransaction.builder()
                            .memberId(member.getMemberId())
                            .invoiceId(invoice.getInvoiceId())
                            .txnType("ADD")
                            .points(invoice.getUseScore())
                            .balanceAfter((double) currentScore)
                            .txnDate(LocalDateTime.now())
                            .build();
                    scoreTransactionRepository.save(refundTx);
                }
                
                // Thu hồi điểm đã tích lũy
                if (invoice.getAddScore() != null && invoice.getAddScore() > 0) {
                    currentScore = Math.max(0, currentScore - invoice.getAddScore());
                    ScoreTransaction recallTx = ScoreTransaction.builder()
                            .memberId(member.getMemberId())
                            .invoiceId(invoice.getInvoiceId())
                            .txnType("SUB")
                            .points(invoice.getAddScore())
                            .balanceAfter((double) currentScore)
                            .txnDate(LocalDateTime.now())
                            .build();
                    scoreTransactionRepository.save(recallTx);
                }
                
                member.setScore(currentScore);
                memberRepository.save(member);
            }
        }
        
        // 3. Mở khóa các ghế trong SCHEDULE_SEAT
        List<InvoiceSeat> invoiceSeats = invoiceSeatRepository.findByInvoiceId(invoiceId);
        unlockScheduleSeats(invoiceSeats);
    }

    @Transactional
    public Invoice createInvoicePending(ConfirmPaymentRequest request) {
        // 1. Kiểm tra tranh chấp trùng ghế trước
        assertSeatsBookable(request.getScheduleId(), request.getSeatIds());

        // Kiểm tra giới hạn sử dụng điểm tối đa 20% giá trị tiền vé
        Schedule scheduleObj = scheduleRepository.findById(request.getScheduleId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy suất chiếu ID: " + request.getScheduleId()));
        double originalTicketSum = 0.0;
        for (Integer seatId : request.getSeatIds()) {
            Seat seat = seatRepository.findById(seatId).orElse(null);
            originalTicketSum += pricingService.calculatePrice(scheduleObj, seat).doubleValue();
        }
        int finalUseScore = request.getUseScore() != null ? request.getUseScore() : 0;
        int maxScoreAllowed = (int) Math.floor((originalTicketSum * 0.20) / 1000.0);
        if (finalUseScore > maxScoreAllowed) {
            throw new IllegalArgumentException("Chỉ được sử dụng tối đa 20% tổng tiền vé để giảm giá (Tối đa: " + maxScoreAllowed + " điểm).");
        }

        // 2. Xác định tài khoản đặt vé
        Account account = getLoggedInAccount();
        if (account == null) {
            throw new IllegalStateException("Vui lòng đăng nhập để thực hiện thanh toán.");
        }

        int addScore = (int) (request.getTotalMoney() * 0.05 / 1000);

        // 3. Tạo hóa đơn INVOICE ở trạng thái PENDING (0)
        Invoice invoice = Invoice.builder()
                .accountId(account.getAccountId())
                .scheduleId(request.getScheduleId())
                .promotionId(request.getPromotionId())
                .bookingDate(LocalDateTime.now())
                .totalMoney(request.getTotalMoney())
                .useScore(request.getUseScore() != null ? request.getUseScore() : 0)
                .addScore(addScore)
                .status(0) // Trạng thái Chờ thanh toán
                .build();

        invoice = invoiceRepository.save(invoice);

        // 4. Khóa ghế tạm thời (DRAFT) và tạo INVOICE_SEAT
        Schedule schedule = scheduleRepository.findById(request.getScheduleId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy suất chiếu ID: " + request.getScheduleId()));

        String accountId = account.getAccountId();
        LocalDateTime now = LocalDateTime.now();

        for (Integer seatId : request.getSeatIds()) {
            ScheduleSeat scheduleSeat = scheduleSeatRepository.findByScheduleIdAndSeatId(request.getScheduleId(), seatId)
                    .orElse(null);

            if (scheduleSeat == null) {
                scheduleSeat = ScheduleSeat.builder()
                        .scheduleId(request.getScheduleId())
                        .seatId(seatId)
                        .build();
            }
            scheduleSeat.setSeatStatus(ScheduleSeat.STATUS_DRAFT);
            scheduleSeat.setReservedAt(now);
            scheduleSeat.setReservedBy(accountId);
            scheduleSeat = scheduleSeatRepository.save(scheduleSeat);

            Seat seat = seatRepository.findById(seatId).orElse(null);
            double actualPrice = pricingService.calculatePrice(schedule, seat).doubleValue();

            InvoiceSeat invoiceSeat = InvoiceSeat.builder()
                    .invoiceId(invoice.getInvoiceId())
                    .scheduleSeatId(scheduleSeat.getScheduleSeatId())
                    .price(actualPrice)
                    .build();
            invoiceSeatRepository.save(invoiceSeat);
        }

        seatRealtimeService.broadcastSeatStatus(
                request.getScheduleId(),
                request.getSeatIds(),
                ScheduleSeat.STATUS_DRAFT);

        return invoice;
    }

    @Transactional
    public void completeMomoPayment(Integer invoiceId, String txnRef, Double amount) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hóa đơn ID: " + invoiceId));
        
        if (invoice.getStatus() == 1) {
            return; // Đã xử lý thanh toán thành công trước đó (tránh trùng lặp)
        }

        // 1. Cập nhật hóa đơn thành Đã thanh toán (1)
        invoice.setStatus(1);
        invoiceRepository.save(invoice);

        // 2. Ghi nhận giao dịch thanh toán
        Payment payment = Payment.builder()
                .invoiceId(invoice.getInvoiceId())
                .txnRef(txnRef)
                .paymentMethod("MOMO")
                .amount(amount)
                .paymentStatus("SUCCESS")
                .createdAt(LocalDateTime.now())
                .build();
        paymentRepository.save(payment);

        // 3. Cộng trừ điểm thành viên
        Member member = memberRepository.findByAccountAccountId(invoice.getAccountId()).orElse(null);
        if (member != null) {
            int currentScore = member.getScore();
            int useScore = invoice.getUseScore();
            if (useScore > 0) {
                currentScore -= useScore;
                ScoreTransaction subTx = ScoreTransaction.builder()
                        .memberId(member.getMemberId())
                        .invoiceId(invoice.getInvoiceId())
                        .txnType("SUB")
                        .points(useScore)
                        .balanceAfter((double) currentScore)
                        .txnDate(LocalDateTime.now())
                        .build();
                scoreTransactionRepository.save(subTx);
            }
            int addScore = invoice.getAddScore();
            if (addScore > 0) {
                currentScore += addScore;
                ScoreTransaction addTx = ScoreTransaction.builder()
                        .memberId(member.getMemberId())
                        .invoiceId(invoice.getInvoiceId())
                        .txnType("ADD")
                        .points(addScore)
                        .balanceAfter((double) currentScore)
                        .txnDate(LocalDateTime.now())
                        .build();
                scoreTransactionRepository.save(addTx);
            }
            member.setScore(currentScore);
            memberRepository.save(member);
        }

        // 4. Chuyển ghế DRAFT → BOOKED
        List<InvoiceSeat> invoiceSeats = invoiceSeatRepository.findByInvoiceId(invoiceId);
        List<Integer> seatIds = new ArrayList<>();
        Integer scheduleId = invoice.getScheduleId();
        for (InvoiceSeat is : invoiceSeats) {
            ScheduleSeat ss = scheduleSeatRepository.findById(is.getScheduleSeatId()).orElse(null);
            if (ss != null) {
                ss.setSeatStatus(ScheduleSeat.STATUS_BOOKED);
                scheduleSeatRepository.save(ss);
                seatIds.add(ss.getSeatId());
            }
        }
        if (!seatIds.isEmpty()) {
            seatRealtimeService.broadcastSeatStatus(scheduleId, seatIds, ScheduleSeat.STATUS_BOOKED);
        }
    }

    @Transactional
    public void failMomoPayment(Integer invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hóa đơn ID: " + invoiceId));
        
        if (invoice.getStatus() != 0) {
            return; // Chỉ xử lý nếu hóa đơn đang ở trạng thái PENDING
        }

        // 1. Cập nhật trạng thái hóa đơn thành Hủy/Thất bại (2)
        invoice.setStatus(2);
        invoiceRepository.save(invoice);

        // 2. Ghi nhận giao dịch thanh toán thất bại
        Payment payment = Payment.builder()
                .invoiceId(invoice.getInvoiceId())
                .txnRef("MOMO-FAIL-" + System.currentTimeMillis())
                .paymentMethod("MOMO")
                .amount(invoice.getTotalMoney())
                .paymentStatus("FAILED")
                .createdAt(LocalDateTime.now())
                .build();
        paymentRepository.save(payment);

        // 3. Mở khóa ghế
        List<InvoiceSeat> invoiceSeats = invoiceSeatRepository.findByInvoiceId(invoiceId);
        unlockScheduleSeats(invoiceSeats);
    }

    public Invoice getPendingInvoiceForCurrentUser(Integer invoiceId) {
        Account account = getLoggedInAccount();
        if (account == null) {
            throw new IllegalStateException("Vui lòng đăng nhập.");
        }

        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hóa đơn ID: " + invoiceId));

        if (!invoice.getAccountId().equals(account.getAccountId())) {
            throw new IllegalArgumentException("Hóa đơn không thuộc quyền sở hữu của bạn.");
        }

        if (invoice.getStatus() != 0) {
            throw new IllegalArgumentException("Hóa đơn này không ở trạng thái chờ thanh toán.");
        }

        return invoice;
    }

    private Account getLoggedInAccount() {
        String username = "customer"; // Fallback cho môi trường test local
        org.springframework.security.core.Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            username = auth.getPrincipal().toString();
        }
        return accountRepository.findByUsername(username).orElse(null);
    }
}