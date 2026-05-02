package cz.fit.hotel.rest;

import cz.fit.hotel.business.ReservationManager;
import cz.fit.hotel.model.Employee;
import cz.fit.hotel.model.ExtraService;
import cz.fit.hotel.model.Reservation;
import cz.fit.hotel.model.ReservationExtraService;
import cz.fit.hotel.model.ReservationStatus;
import cz.fit.hotel.repository.EmployeeRepository;
import cz.fit.hotel.repository.ExtraServiceRepository;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.SecurityContext;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

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

    @Inject
    ExtraServiceRepository extraServiceRepository;

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
    public Reservation create(ReservationRequest request, @Context SecurityContext securityContext) {
        Reservation reservation = toReservation(request);
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
    public Reservation update(@PathParam("id") Long id, ReservationRequest request) {
        Reservation reservation = toReservation(request);
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

    private Reservation toReservation(ReservationRequest request) {
        if (request == null) {
            throw new BadRequestException("Reservation payload is required");
        }

        Reservation reservation = new Reservation();
        reservation.setCheckInDate(request.checkInDate);
        reservation.setCheckOutDate(request.checkOutDate);
        reservation.setStatus(request.status);
        reservation.setNumberOfGuests(request.numberOfGuests);
        reservation.setPaymentStatus(request.paymentStatus);
        reservation.setSpecialRequests(request.specialRequests);
        reservation.setRoomId(request.roomId);
        reservation.setCustomerId(request.customerId);
        reservation.setEmployeeId(request.employeeId);

        if (request.serviceItems != null) {
            reservation.getExtraServices().clear();
            reservation.getExtraServices().addAll(toReservationExtraServices(request.serviceItems));
        }

        return reservation;
    }

    private Set<ReservationExtraService> toReservationExtraServices(List<ServiceItemRequest> items) {
        Set<ReservationExtraService> mappedItems = new LinkedHashSet<>();
        for (ServiceItemRequest item : items) {
            if (item == null) {
                continue;
            }
            if (item.serviceId == null) {
                throw new BadRequestException("Each service item must include serviceId");
            }

            ExtraService service = extraServiceRepository.findById(item.serviceId);
            if (service == null) {
                throw new BadRequestException("Service not found: " + item.serviceId);
            }

            ReservationExtraService mapped = new ReservationExtraService();
            mapped.setService(service);
            mapped.setQuantity(item.quantity == null ? 1 : item.quantity);
            mappedItems.add(mapped);
        }
        return mappedItems;
    }

    public static class ReservationRequest {
        public LocalDate checkInDate;
        public LocalDate checkOutDate;
        public ReservationStatus status;
        public Integer numberOfGuests;
        public cz.fit.hotel.model.PaymentStatus paymentStatus;
        public String specialRequests;
        public Long roomId;
        public Long customerId;
        public Long employeeId;
        public List<ServiceItemRequest> serviceItems;
    }

    public static class ServiceItemRequest {
        public Long serviceId;
        public Integer quantity;
    }
}
