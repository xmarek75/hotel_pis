package cz.fit.hotel.security;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.json.Json;
import jakarta.json.JsonObject;
import jakarta.json.JsonReader;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;

@ApplicationScoped
public class JwtService {

    private static final String HMAC_ALGO = "HmacSHA256";
    private static final long TOKEN_TTL_SECONDS = 60L * 60L * 8L; // 8h
    private static final Base64.Encoder URL_ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder URL_DECODER = Base64.getUrlDecoder();

    private final byte[] secret;

    public JwtService() {
        String fromEnv = System.getenv("HOTEL_JWT_SECRET");
        String material = (fromEnv != null && !fromEnv.isBlank())
                ? fromEnv
                : "change-me-in-prod-very-long-hotel-jwt-secret";
        this.secret = material.getBytes(StandardCharsets.UTF_8);
    }

    public String createToken(String username, String role) {
        Instant now = Instant.now();
        JsonObject header = Json.createObjectBuilder()
                .add("alg", "HS256")
                .add("typ", "JWT")
                .build();
        JsonObject payload = Json.createObjectBuilder()
                .add("sub", username)
                .add("role", role)
                .add("iat", now.getEpochSecond())
                .add("exp", now.plusSeconds(TOKEN_TTL_SECONDS).getEpochSecond())
                .build();

        String headerPart = encode(header.toString());
        String payloadPart = encode(payload.toString());
        String signingInput = headerPart + "." + payloadPart;
        String signaturePart = sign(signingInput);
        return signingInput + "." + signaturePart;
    }

    public JwtClaims verify(String token) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Missing JWT");
        }
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            throw new IllegalArgumentException("Invalid JWT format");
        }

        String signingInput = parts[0] + "." + parts[1];
        String expectedSignature = sign(signingInput);
        if (!MessageDigest.isEqual(expectedSignature.getBytes(StandardCharsets.UTF_8), parts[2].getBytes(StandardCharsets.UTF_8))) {
            throw new IllegalArgumentException("Invalid JWT signature");
        }

        JsonObject payload = parseJson(decode(parts[1]));
        String subject = payload.getString("sub", null);
        String role = payload.getString("role", null);
        long exp = payload.getJsonNumber("exp").longValue();
        if (subject == null || role == null) {
            throw new IllegalArgumentException("Invalid JWT payload");
        }
        if (Instant.now().getEpochSecond() >= exp) {
            throw new IllegalArgumentException("JWT expired");
        }
        return new JwtClaims(subject, role);
    }

    private String sign(String input) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGO);
            mac.init(new SecretKeySpec(secret, HMAC_ALGO));
            byte[] sig = mac.doFinal(input.getBytes(StandardCharsets.UTF_8));
            return URL_ENCODER.encodeToString(sig);
        } catch (Exception e) {
            throw new IllegalStateException("JWT signing failed", e);
        }
    }

    private static String encode(String value) {
        return URL_ENCODER.encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    private static String decode(String value) {
        return new String(URL_DECODER.decode(value), StandardCharsets.UTF_8);
    }

    private static JsonObject parseJson(String json) {
        try (JsonReader reader = Json.createReader(new StringReader(json))) {
            return reader.readObject();
        }
    }

    public record JwtClaims(String username, String role) {
    }
}
