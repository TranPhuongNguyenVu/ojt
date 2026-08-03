package org.example.be.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.be.dto.TicketDetailDTO;
import org.example.be.entity.Invoice;
import org.example.be.entity.Ticket;
import org.example.be.event.InvoicePaidEvent;
import org.example.be.repository.AccountRepository;
import org.example.be.repository.InvoiceRepository;
import org.example.be.repository.TicketRepository;
import org.example.be.util.EmailPalette;
import org.example.be.util.QrCodeGenerator;
import org.springframework.context.MessageSource;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketEmailService {

    private static final Locale VIETNAMESE_LOCALE = new Locale("vi", "VN");
    private static final DateTimeFormatter SHOWTIME_FORMATTER =
            DateTimeFormatter.ofPattern("HH:mm EEEE, dd/MM/yyyy", VIETNAMESE_LOCALE);
    private static final String TICKET_TEMPLATE_NAME = "mail/ticket-confirmation";
    private static final int EMAIL_QR_SOURCE_SIZE = 480;
    private static final double SCORE_TO_MONEY_RATE = 1000.0;

    private final TicketService ticketService;
    private final TicketRepository ticketRepository;
    private final InvoiceRepository invoiceRepository;
    private final AccountRepository accountRepository;
    private final EmailService emailService;
    private final TemplateEngine templateEngine;
    private final MessageSource messageSource;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onInvoicePaid(InvoicePaidEvent event) {
        issueTicketAndNotify(event.invoiceId());
    }

    public void issueTicketAndNotify(Integer invoiceId) {
        try {
            boolean created = ticketService.createTicketForPaidInvoice(invoiceId);
            if (!created) {
                return;
            }
            sendTicketEmail(invoiceId);
        } catch (Exception e) {
            log.error("Failed to issue ticket / send confirmation email for invoice {}", invoiceId, e);
        }
    }

    private void sendTicketEmail(Integer invoiceId) {
        Ticket ticket = ticketRepository.findByInvoiceId(invoiceId).orElse(null);
        Invoice invoice = invoiceRepository.findById(invoiceId).orElse(null);
        if (ticket == null || invoice == null) {
            log.warn("Ticket or invoice not found while sending ticket confirmation email for invoice {}", invoiceId);
            return;
        }
        String recipientEmail = resolveRecipientEmail(invoice, invoiceId);
        if (recipientEmail == null) {
            return;
        }

        TicketDetailDTO detail = ticketService.buildDetail(ticket, invoice);

        String qrCid = "ticket-qr-" + invoice.getInvoiceId();
        byte[] qrPng = QrCodeGenerator.generatePng(ticket.getTicketCode(), EMAIL_QR_SOURCE_SIZE);

        Context context = new Context(VIETNAMESE_LOCALE);
        applyPalette(context);
        context.setVariable("movieName", detail.getMovieName());
        context.setVariable("ticketCode", detail.getTicketCode());
        context.setVariable("roomName", detail.getRoomName());
        context.setVariable("showtimeText",
                detail.getShowtime() != null ? SHOWTIME_FORMATTER.format(detail.getShowtime()) : "");
        context.setVariable("ticketCount", detail.getTicketCount());
        context.setVariable("seats", detail.getSeats());
        context.setVariable("concessions", detail.getConcessions());
        double discountAmount = resolveDiscountAmount(detail.getUseScore());
        context.setVariable("totalMoney", detail.getTotalMoney());
        context.setVariable("discountAmount", discountAmount);
        context.setVariable("subtotalMoney", detail.getTotalMoney() + discountAmount);
        context.setVariable("qrCid", qrCid);

        String html = templateEngine.process(TICKET_TEMPLATE_NAME, context);
        String subject = messageSource.getMessage("ticket.email.subject",
                new Object[]{detail.getMovieName()}, VIETNAMESE_LOCALE);

        boolean sent = emailService.sendHtmlEmailWithInlineImage(recipientEmail, subject, html, qrCid, qrPng);
        if (sent) {
            ticketRepository.markEmailSent(invoiceId, LocalDateTime.now());
        }
    }

    private double resolveDiscountAmount(Integer useScore) {
        return useScore != null ? useScore * SCORE_TO_MONEY_RATE : 0.0;
    }

    private void applyPalette(Context context) {
        context.setVariable("colorPrimary", EmailPalette.PRIMARY);
        context.setVariable("colorPrimaryDark", EmailPalette.PRIMARY_DARK);
        context.setVariable("colorSurface", EmailPalette.SURFACE);
        context.setVariable("colorBorder", EmailPalette.BORDER);
        context.setVariable("colorText", EmailPalette.TEXT);
        context.setVariable("colorTextMuted", EmailPalette.TEXT_MUTED);
    }

    private String resolveRecipientEmail(Invoice invoice, Integer invoiceId) {
        if (invoice.getAccountId() == null) {
            log.warn("Invoice {} has no linked account; skipping ticket email", invoiceId);
            return null;
        }
        var account = accountRepository.findById(invoice.getAccountId()).orElse(null);
        if (account == null || account.getEmail() == null || account.getEmail().isBlank()) {
            log.warn("Invoice {} account has no email address; skipping ticket email", invoiceId);
            return null;
        }
        return account.getEmail();
    }
}
