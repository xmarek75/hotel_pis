package cz.fit.hotel.security;

import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.SecurityContext;
import jakarta.ws.rs.ext.Provider;

import java.security.Principal;

@Provider
@Priority(Priorities.AUTHENTICATION)
public class JwtAuthFilter implements ContainerRequestFilter {

    @Inject
    JwtService jwtService;

    @Override
    public void filter(ContainerRequestContext requestContext) {
        String path = requestContext.getUriInfo().getPath();
        if (path == null) {
            path = "";
        }
        // Login musi zustat verejny i pri ruznem context rootu nebo reverzni proxy.
        if (path.equals("auth/login") || path.endsWith("/auth/login") || path.contains("auth/login")) {
            return; // login endpoint is public
        }

        String authHeader = requestContext.getHeaderString(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new NotAuthorizedException("Bearer token is required");
        }

        String token = authHeader.substring("Bearer ".length()).trim();
        JwtService.JwtClaims claims;
        try {
            claims = jwtService.verify(token);
        } catch (IllegalArgumentException ex) {
            throw new NotAuthorizedException("Invalid token");
        }

        SecurityContext current = requestContext.getSecurityContext();
        requestContext.setSecurityContext(new JwtSecurityContext(claims.username(), claims.role(), current.isSecure()));
    }

    private static class JwtSecurityContext implements SecurityContext {
        private final Principal principal;
        private final String role;
        private final boolean secure;

        private JwtSecurityContext(String username, String role, boolean secure) {
            this.principal = () -> username;
            this.role = role;
            this.secure = secure;
        }

        @Override
        public Principal getUserPrincipal() {
            return principal;
        }

        @Override
        public boolean isUserInRole(String role) {
            if (role == null) {
                return false;
            }
            if (role.equals(this.role)) {
                return true;
            }
            // Historicky je v casti aplikace role male "administrator" a jinde enum "ADMINISTRATOR".
            return "ADMINISTRATOR".equals(this.role) && "administrator".equals(role);
        }

        @Override
        public boolean isSecure() {
            return secure;
        }

        @Override
        public String getAuthenticationScheme() {
            return "Bearer";
        }
    }
}
