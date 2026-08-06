package org.example.be.service;

import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    // Kho RAM lưu trữ đa năng (Chìa khóa có thể là: email_REGISTER, email_FORGOT_PASS, v.v...)
    private final Map<String, OtpData> otpStorage = new ConcurrentHashMap<>();

    // Hàm đẻ ra mã 6 số và lưu vào kho với Hạn 10 phút
    public String generateAndStoreOtp(String key) {
        String normalizedKey = normalizeKey(key);
        String otpCode = String.format("%06d", new Random().nextInt(1_000_000));
        LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(10);

        otpStorage.put(normalizedKey, new OtpData(otpCode, expiryTime));
        return otpCode;
    }

    // Hàm đối chiếu mã do người dùng nhập vào
    public boolean validateOtp(String key, String inputOtp) {
        String normalizedKey = normalizeKey(key);
        OtpData data = otpStorage.get(normalizedKey);

        if (data == null) return false; // Không có mã trong kho

        if (LocalDateTime.now().isAfter(data.expiryTime)) {
            otpStorage.remove(normalizedKey); // Quá hạn 10 phút -> Vứt mã
            return false;
        }

        if (data.otpCode.equals(normalizeOtp(inputOtp))) {
            otpStorage.remove(normalizedKey); // Mã đúng -> Xài xong vứt luôn chống dùng lại
            return true;
        }

        return false;
    }

    // Hàm chỉ kiểm tra mã OTP mà không xóa (chống tiêu thụ trước khi đổi mật khẩu)
    public boolean checkOtpOnly(String key, String inputOtp) {
        String normalizedKey = normalizeKey(key);
        OtpData data = otpStorage.get(normalizedKey);

        if (data == null) return false;

        if (LocalDateTime.now().isAfter(data.expiryTime)) {
            otpStorage.remove(normalizedKey);
            return false;
        }

        return data.otpCode.equals(normalizeOtp(inputOtp));
    }

    private String normalizeKey(String key) {
        return key == null ? "" : key.trim().toLowerCase();
    }

    private String normalizeOtp(String otp) {
        return otp == null ? "" : otp.trim();
    }

    // Class con chứa cấu trúc Dữ liệu
    private static class OtpData {
        String otpCode;
        LocalDateTime expiryTime;

        OtpData(String otpCode, LocalDateTime expiryTime) {
            this.otpCode = otpCode;
            this.expiryTime = expiryTime;
        }
    }
}