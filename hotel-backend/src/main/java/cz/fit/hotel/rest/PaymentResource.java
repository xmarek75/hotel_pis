package cz.fit.hotel.rest;

import cz.fit.hotel.business.PaymentManager;
import cz.fit.hotel.model.Payment;
import cz.fit.hotel.model.PaymentStatus;
import cz.fit.hotel.model.Reservation;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Path("/payments")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({"administrator", "RECEPTIONIST"})
public class PaymentResource {

    @Inject
    PaymentManager paymentManager;

    @GET
    public List<Payment> all() {
        return paymentManager.findAll();
    }

    @GET
    @Path("/{id}")
    public Payment one(@PathParam("id") Long id) {
        return paymentManager.findById(id);
    }

    @POST
    public Payment create(PaymentCreateRequest request) {
        try {
            return paymentManager.create(toPayment(request));
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException(ex.getMessage());
        }
    }

    @DELETE
    @Path("/{id}")
    public void delete(@PathParam("id") Long id) {
        paymentManager.delete(id);
    }

    private Payment toPayment(PaymentCreateRequest request) {
        if (request == null || request.reservationId == null || request.amount == null) {
            throw new BadRequestException("reservationId and amount are required");
        }

        Payment payment = new Payment();

        // Payment manager potrebuje odkaz na rezervaci; pro request staci lehky objekt jen s ID.
        Reservation reservation = new Reservation();
        reservation.setId(request.reservationId);

        payment.setReservation(reservation);
        payment.setAmount(request.amount);
        payment.setPaymentDate(request.paymentDate);
        if (request.status != null && !request.status.isBlank()) {
            try {
                payment.setStatus(PaymentStatus.valueOf(request.status.trim()));
            } catch (IllegalArgumentException ex) {
                throw new BadRequestException("Invalid payment status");
            }
        }
        return payment;
    }

    public static class PaymentCreateRequest {
        public Long reservationId;
        public BigDecimal amount;
        public String status;
        public LocalDateTime paymentDate;
    }
}
