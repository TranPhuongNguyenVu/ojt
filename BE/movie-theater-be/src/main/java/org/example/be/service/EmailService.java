package org.example.be.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    // Đây là Cỗ máy gửi thư đã được Spring Boot tự cấu hình dựa vào file properties
    private final JavaMailSender mailSender;

    @Value("${mtms.cinema.name}")
    private String cinemaName;

    @Value("${spring.mail.username}")
    private String senderEmail;

    public void sendSimpleEmail(String toEmail, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();

            // Lắp đạn vào thư
            message.setTo(toEmail);            // Gửi cho ai?
            message.setSubject(subject);       // Tiêu đề thư
            message.setText(body);             // Nội dung thư
            message.setFrom(cinemaName + " <" + senderEmail + ">"); // Tên người gửi

            // Bấm nút phóng thư
            mailSender.send(message);

            System.out.println("✅ Gửi Email tới " + toEmail + " THÀNH CÔNG!");
        } catch (Exception e) {
            System.out.println("⚠️ Lỗi khi gửi Email (SMTP): " + e.getMessage());
            log.warn("Failed to send simple email to {}: {}", toEmail, e.getMessage());
        }
    }

    /**
     * @return true if the message was handed off to the SMTP server successfully, false otherwise.
     *         Callers must check this before treating the email as delivered — this method never throws.
     */
    public boolean sendHtmlEmailWithInlineImage(String toEmail, String subject, String htmlBody,
            String inlineImageCid, byte[] inlineImageBytes) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            helper.setFrom(cinemaName + " <" + senderEmail + ">");
            if (inlineImageBytes != null && inlineImageCid != null) {
                helper.addInline(inlineImageCid, () -> new java.io.ByteArrayInputStream(inlineImageBytes), "image/png");
            }
            mailSender.send(mimeMessage);
            log.info("Sent HTML email to {}", toEmail);
            return true;
        } catch (Exception e) {
            log.error("Failed to send HTML email to {}", toEmail, e);
            return false;
        }
    }
}