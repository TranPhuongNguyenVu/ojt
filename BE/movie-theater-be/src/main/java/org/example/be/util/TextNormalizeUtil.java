package org.example.be.util;

import java.text.Normalizer;
import java.util.regex.Pattern;

public final class TextNormalizeUtil {

    private static final Pattern DIACRITICS = Pattern.compile("\\p{M}");

    private TextNormalizeUtil() {
    }

    public static String stripDiacritics(String input) {
        if (input == null) {
            return "";
        }
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        String stripped = DIACRITICS.matcher(normalized).replaceAll("");
        return stripped.replace('đ', 'd').replace('Đ', 'D');
    }
}
