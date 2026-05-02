package cz.fit.hotel.rest;

import cz.fit.hotel.business.ReservationManager;
import cz.fit.hotel.model.Employee;
import cz.fit.hotel.model.Reservation;
import cz.fit.hotel.model.ReservationStatus;
import cz.fit.hotel.repository.EmployeeRepository;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.SecurityContext;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.List;

@Path("/reservations")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({"administrator", "RECEPTIONIST", "MANAGER"})
@Tag(name = "Reservations", description = "Core management of room bookings and guest stays")
public class ReservationResource {

    @Inject
    ReservationManager reservationManager;

    @Inject
    EmployeeRepository employeeRepository;

    @GET
    @Operation(summary = "List all reservations", description = "Retrieves all hotel bookings from the database.")
    public List<Reservation> all() {
        return reservationManager.findAll();
    }

    @GET
    @Path("/{id}")
    @Operation(summary = "Get reservation by ID", description = "Retrieves full details of a specific booking.")
    public Reservation one(@PathParam("id") Long id) {
        return reservationManager.findById(id);
    }

    @POST
    @Operation(summary = "Create new reservation", description = "Registers a new booking. Automatically links to the currently logged-in employee if not specified.")
    public Reservation create(Reservation reservation, @Context SecurityContext securityContext) {
        if (reservation.getEmployeeId() == null && reservation.getEmployee() == null && securityContext != null
                && securityContext.getUserPrincipal() != null) {
            String username = securityContext.getUserPrincipal().getName();
            if (username != null && !username.isBlank()) {
                Employee employee = employeeRepository.findByUsername(username);
                if (employee != null && employee.isActive()) {
                    reservation.setEmployeeId(employee.getId());
                }
            }
        }
        return reservationManager.create(reservation);
    }

    @PUT
    @Path("/{id}")
    @Operation(summary = "Update reservation", description = "Modifies an existing booking's dates, guests, or requests.")
    public Reservation update(@PathParam("id") Long id, Reservation reservation) {
        return reservationManager.update(id, reservation);
    }

    @PUT
    @Path("/{id}/status")
    @Operation(summary = "Update status", description = "Changes the lifecycle state (e.g., Checked-In, Cancelled) of a reservation.")
    public Reservation updateStatus(@PathParam("id") Long id, @QueryParam("value") ReservationStatus status) {
        if (status == null) {
            throw new BadRequestException("Missing query param 'value' with reservation status");
        }
        return reservationManager.updateStatus(id, status);
    }

    @DELETE
    @Path("/{id}")
    @Operation(summary = "Cancel reservation", description = "Performs a logical cancellation of the booking.")
    public void delete(@PathParam("id") Long id) {
        reservationManager.delete(id);
    }
}
