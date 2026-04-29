package cz.fit.hotel.rest;

import cz.fit.hotel.model.Employee;
import cz.fit.hotel.model.EmployeeRole;
import cz.fit.hotel.repository.EmployeeRepository;
import cz.fit.hotel.security.JwtService;
import cz.fit.hotel.security.PasswordHasher;
import jakarta.annotation.security.PermitAll;
import jakarta.inject.Inject;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/login")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class LoginResource {

    @Inject
    EmployeeRepository employeeRepository;

    @Inject
    PasswordHasher passwordHasher;

    @Inject
    JwtService jwtService;

    @POST
    @PermitAll
    public LoginResponse login(LoginRequest request) {
        if (request == null || request.username == null || request.password == null
                || request.username.isBlank() || request.password.isBlank()) {
            throw new BadRequestException("Username and password are required");
        }

        Employee employee = employeeRepository.findByUsername(request.username.trim());
        if (employee == null || !employee.isActive()) {
            throw new NotAuthorizedException("Invalid credentials");
        }

        String stored = employee.getPassword();
        boolean valid = passwordHasher.verify(request.password, stored);
        if (!valid && (stored != null && !passwordHasher.isHashFormat(stored))) {
            valid = stored.equals(request.password);
        }
        if (!valid) {
            throw new NotAuthorizedException("Invalid credentials");
        }

        String role = roleNameForSecurity(employee.getRole());
        String token = jwtService.createToken(employee.getUsername(), role);
        return new LoginResponse(token, employee.getUsername(), role);
    }

    private String roleNameForSecurity(EmployeeRole role) {
        if (role == null) {
            return "RECEPTIONIST";
        }
        return switch (role) {
            case ADMINISTRATOR -> "administrator";
            case RECEPTIONIST -> "RECEPTIONIST";
            case MANAGER -> "MANAGER";
        };
    }

    public static class LoginRequest {
        public String username;
        public String password;
    }

    public record LoginResponse(String token, String username, String role) {
    }
}
