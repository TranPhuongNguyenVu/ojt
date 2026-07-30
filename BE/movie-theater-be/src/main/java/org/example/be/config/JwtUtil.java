package org.example.be.config;



import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.example.be.entity.Account;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtil {

    // Lấy chuỗi bí mật (d4fba7b1-...) từ file application.properties
    @Value("${jwt.secret}")
    private String SECRET_KEY;

    // Thời gian sống của Token: 1 ngày = 86.400.000 mili-giây
    private final long EXPIRATION_TIME = 86400000;

    // Chuyển chuỗi SECRET_KEY thành một cái chìa khóa thuật toán thật sự
    private SecretKey getSignInKey() {
        return Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
    }

    // -----------------------------------------------------
    // 1. HÀM TẠO TOKEN KHI ĐĂNG NHẬP THÀNH CÔNG
    // -----------------------------------------------------
    public String generateToken(Account account) {
        return Jwts.builder()
                .subject(account.getUsername()) // Lưu username vào bụng Token
                .claim("role", "ROLE_" + account.getRole().getRoleName()) // Lưu Role vào Token
                .issuedAt(new Date(System.currentTimeMillis())) // Giờ phát hành
                .expiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME)) // Giờ hết hạn
                .signWith(getSignInKey()) // Ký tên đóng dấu bảo mật
                .compact(); // Nén lại thành chuỗi String
    }

    // -----------------------------------------------------
    // 2. HÀM KIỂM TRA ĐỘ CHUẨN XÁC CỦA TOKEN
    // -----------------------------------------------------
    public boolean isTokenValid(String token) {
        try {
            return !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }

    // -----------------------------------------------------
    // 3. CÁC HÀM TIỆN ÍCH (MỔ BỤNG TOKEN ĐỂ LẤY DỮ LIỆU)
    // -----------------------------------------------------
    public String extractUsername(String token) {
        return getClaims(token).getSubject(); // Móc username ra
    }

    public String extractRole(String token) {
        return getClaims(token).get("role", String.class); // Móc Role ra
    }

    private boolean isTokenExpired(String token) {
        return getClaims(token).getExpiration().before(new Date());
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSignInKey()) // Dùng chìa khóa để mở
                .build()
                .parseSignedClaims(token) // Đọc dữ liệu
                .getPayload(); // Lấy cục dữ liệu ra
    }
}