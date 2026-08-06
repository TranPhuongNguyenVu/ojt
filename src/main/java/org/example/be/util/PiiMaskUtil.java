package org.example.be.util;

public final class PiiMaskUtil {

    private PiiMaskUtil() {
    }

    public static String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return email;
        }
        String[] parts = email.split("@", 2);
        String local = parts[0];
        String domain = parts[1];
        String maskedLocal = local.length() <= 3 ? local.substring(0, 1) + "***" : local.substring(0, 3) + "***";
        return maskedLocal + "@" + domain;
    }

    public static String maskPhone(String phone) {
        if (phone == null || phone.length() <= 5) {
            return phone;
        }
        int visibleTail = 3;
        String prefix = phone.substring(0, phone.length() - visibleTail - 3);
        String tail = phone.substring(phone.length() - visibleTail);
        return prefix + "***" + tail;
    }
}
