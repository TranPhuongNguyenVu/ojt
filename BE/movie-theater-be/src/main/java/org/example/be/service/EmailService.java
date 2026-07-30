package org.example.be.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    // Đây là Cỗ máy gửi thư đã được Spring Boot tự cấu hình dựa vào file properties
    private final JavaMailSender mailSender;

    public void sendSimpleEmail(String toEmail, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();

            // Lắp đạn vào thư
            message.setTo(toEmail);            // Gửi cho ai?
            message.setSubject(subject);       // Tiêu đề thư
            message.setText(body);             // Nội dung thư
            message.setFrom("Rạp Chiếu Phim MTMS <Longtg.ce191181@gmail.com>"); // Tên người gửi

            // Bấm nút phóng thư
            mailSender.send(message);

            System.out.println("✅ Gửi Email tới " + toEmail + " THÀNH CÔNG!");
        } catch (Exception e) {
            System.out.println("❌ Lỗi khi gửi Email: " + e.getMessage());
            throw new IllegalStateException("Không thể gửi email. Vui lòng thử lại sau!", e);
        }
    }
}