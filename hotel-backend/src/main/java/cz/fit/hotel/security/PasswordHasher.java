package cz.fit.hotel.security;

import jakarta.enterprise.context.ApplicationScoped;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.SecureRandom;
import java.util.Base64;

@ApplicationScoped
public class PasswordHasher {

    private static final String ALGORITHM = "PBKDF2WithHmacSHA256";
    private static final int ITERATIONS = 120_000;
    private static final int SALT_BYTES = 16;
    private static final int KEY_LENGTH_BITS = 256;
    private static final String PREFIX = "pbkdf2";

    public String hash(String rawPassword) {
        if (rawPassword == null || rawPassword.isBlank()) {
            throw new IllegalArgumentException("Password is required");
        }
        // Kazde heslo dostane novou sul, aby stejne heslo nevytvarelo stejny hash.
        byte[] salt = new byte[SALT_BYTES];
        new SecureRandom().nextBytes(salt);
        byte[] hash = derive(rawPassword.toCharArray(), salt, ITERATIONS, KEY_LENGTH_BITS);
        return PREFIX + "$" + ITERATIONS + "$" +
                Base64.getEncoder().encodeToString(salt) + "$" +
                Base64.getEncoder().encodeToString(hash);
    }

    public boolean isHashFormat(String value) {
        return value != null && value.startsWith(PREFIX + "$") && value.split("\\$").length == 4;
    }

    public boolean verify(String rawPassword, String storedHash) {
        if (rawPassword == null || rawPassword.isBlank() || storedHash == null || storedHash.isBlank()) {
            return false;
        }
        try {
            String[] parts = storedHash.split("\\$");
            if (parts.length != 4 || !PREFIX.equals(parts[0])) {
                return false;
            }
            int iterations = Integer.parseInt(parts[1]);
            byte[] salt = Base64.getDecoder().decode(parts[2]);
            byte[] expected = Base64.getDecoder().decode(parts[3]);
            byte[] actual = derive(rawPassword.toCharArray(), salt, iterations, expected.length * 8);
            // Konstantni cas pomaha omezit timing side-channel pri porovnani hashe.
            return constantTimeEquals(expected, actual);
        } catch (Exception ex) {
            return false;
        }
    }

    private static byte[] derive(char[] password, byte[] salt, int iterations, int keyLengthBits) {
        try {
            PBEKeySpec spec = new PBEKeySpec(password, salt, iterations, keyLengthBits);
            SecretKeyFactory skf = SecretKeyFactory.getInstance(ALGORITHM);
            return skf.generateSecret(spec).getEncoded();
        } catch (Exception e) {
            throw new IllegalStateException("Password hashing failed", e);
        }
    }

    private static boolean constantTimeEquals(byte[] a, byte[] b) {
        if (a == null || b == null || a.length != b.length) {
            return false;
        }
        int result = 0;
        for (int i = 0; i < a.length; i++) {
            result |= a[i] ^ b[i];
        }
        return result == 0;
    }
}
