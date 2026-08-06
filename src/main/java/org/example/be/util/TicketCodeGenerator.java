package org.example.be.util;

import java.security.SecureRandom;

public final class TicketCodeGenerator {

    private static final char[] ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ".toCharArray();
    private static final int DEFAULT_LENGTH = 8;
    private static final SecureRandom RANDOM = new SecureRandom();

    private TicketCodeGenerator() {
    }

    public static String generate() {
        return generate(DEFAULT_LENGTH);
    }

    public static String generate(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(ALPHABET[RANDOM.nextInt(ALPHABET.length)]);
        }
        return sb.toString();
    }
}
