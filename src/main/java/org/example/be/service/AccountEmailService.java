package org.example.be.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.be.util.EmailPalette;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.List;
import java.util.Locale;

/**
 * Renders account-related emails (OTP, mật khẩu, tài khoản mới...) qua cùng một
 * khung giao diện Thymeleaf với email vé xem phim để đồng bộ nhận diện thương hiệu.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AccountEmailService {

    private static final Locale VIETNAMESE_LOCALE = new Locale("vi", "VN");
    private static final String NOTIFICATION_TEMPLATE_NAME = "mail/account-notification";
    private static final String FOOTER_LINE1 = "Đây là email tự động, vui lòng không phản hồi lại email này.";
    private static final String FOOTER_LINE2 = "© ELITE Cinema - Trải nghiệm điện ảnh đỉnh cao";

    private final EmailService emailService;
    private final TemplateEngine templateEngine;

    public record FieldRow(String label, String value) {
    }

    public void sendNotification(String toEmail, String subject, String chipLabel, String title,
            String fullName, List<String> introLines, List<FieldRow> fields,
            String highlightLabel, String highlightValue, String noteText) {
        Context context = new Context(VIETNAMESE_LOCALE);
        applyPalette(context);
        context.setVariable("chipLabel", chipLabel);
        context.setVariable("title", title);
        context.setVariable("fullName", fullName);
        context.setVariable("introLines", introLines);
        context.setVariable("fields", fields);
        context.setVariable("highlightLabel", highlightLabel);
        context.setVariable("highlightValue", highlightValue);
        context.setVariable("noteText", noteText);
        context.setVariable("footerLine1", FOOTER_LINE1);
        context.setVariable("footerLine2", FOOTER_LINE2);

        String html = templateEngine.process(NOTIFICATION_TEMPLATE_NAME, context);
        boolean sent = emailService.sendHtmlEmailWithInlineImage(toEmail, subject, html, null, null);
        if (!sent) {
            log.warn("Failed to send account notification email to {}", toEmail);
        }
    }

    private void applyPalette(Context context) {
        context.setVariable("colorPrimary", EmailPalette.PRIMARY);
        context.setVariable("colorPrimaryDark", EmailPalette.PRIMARY_DARK);
        context.setVariable("colorSurface", EmailPalette.SURFACE);
        context.setVariable("colorBorder", EmailPalette.BORDER);
        context.setVariable("colorText", EmailPalette.TEXT);
        context.setVariable("colorTextMuted", EmailPalette.TEXT_MUTED);
    }
}
