package org.example.be.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.be.entity.Invoice;
import org.example.be.repository.InvoiceRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class BookingScheduler {

    private final InvoiceRepository invoiceRepository;
    private final BookingService bookingService;
    private final TicketService ticketService;

    // Quét mỗi phút: hóa đơn PENDING quá 3 phút + ghế DRAFT quá hạn
    @Scheduled(fixedRate = 60000)
    public void cancelExpiredPendingBookings() {
        LocalDateTime timeoutThreshold = LocalDateTime.now().minusMinutes(3);

        List<Invoice> expiredInvoices = invoiceRepository.findByStatusAndBookingDateBefore(0, timeoutThreshold);

        if (!expiredInvoices.isEmpty()) {
            log.info("Phát hiện {} giao dịch đặt vé quá hạn 3 phút chưa thanh toán. Tiến hành hủy...", expiredInvoices.size());
            for (Invoice invoice : expiredInvoices) {
                try {
                    bookingService.failMomoPayment(invoice.getInvoiceId());
                    log.info("Đã hủy thành công hóa đơn quá hạn ID: {}", invoice.getInvoiceId());
                } catch (Exception e) {
                    log.error("Lỗi khi hủy hóa đơn quá hạn ID: " + invoice.getInvoiceId(), e);
                }
            }
        }

        try {
            bookingService.releaseExpiredDraftSeats();
        } catch (Exception e) {
            log.error("Lỗi giải phóng ghế DRAFT hết hạn", e);
        }
    }

    // Chạy mỗi 1 phút để đánh dấu EXPIRED các vé còn BOOKED nhưng suất chiếu đã kết thúc (khách không đến soát vé, không hoàn tiền)
    @Scheduled(fixedRate = 60000)
    public void expireTicketsForEndedShowtimes() {
        int expiredCount = ticketService.expireEndedShowtimeTickets();
        if (expiredCount > 0) {
            log.info("Đã đánh dấu EXPIRED {} vé do suất chiếu đã kết thúc mà chưa soát vé.", expiredCount);
        }
    }
}
