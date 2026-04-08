package cz.fit.hotel.rest;

import cz.fit.hotel.business.PaymentManager;
import cz.fit.hotel.model.CardPayment;
import cz.fit.hotel.model.CashPayment;
import cz.fit.hotel.model.Payment;
import cz.fit.hotel.model.PaymentMethod;
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
        return paymentManager.create(toPayment(request));
    }

    @DELETE
    @Path("/{id}")
    public void delete(@PathParam("id") Long id) {
        paymentManager.delete(id);
    }

    private Payment toPayment(PaymentCreateRequest request) {
        if (request == null || request.reservationId == null || request.amount == null || request.paymentMethod == null) {
            throw new BadRequestException("reservationId, amount and paymentMethod are required");
        }

        PaymentMethod paymentMethod;
        try {
            paymentMethod = PaymentMethod.valueOf(request.paymentMethod.trim());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid payment method");
        }

        Payment payment = switch (paymentMethod) {
            case CARD -> {
                CardPayment cardPayment = new CardPayment();
                cardPayment.setTransactionId(
                        request.transactionId == null || request.transactionId.isBlank()
                                ? "TXN-" + System.currentTimeMillis()
                                : request.transactionId.trim()
                );
                yield cardPayment;
            }
            case CASH -> {
                CashPayment cashPayment = new CashPayment();
                cashPayment.setReceiptNumber(
                        request.receiptNumber == null || request.receiptNumber.isBlank()
                                ? "RCPT-" + System.currentTimeMillis()
                                : request.receiptNumber.trim()
                );
                yield cashPayment;
            }
            default -> throw new BadRequestException("Unsupported payment method");
        };

        Reservation reservation = new Reservation();
        reservation.setId(request.reservationId);

        payment.setReservation(reservation);
        payment.setAmount(request.amount);
        payment.setPaymentMethod(paymentMethod);
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
        public String paymentMethod;
        public String status;
        public LocalDateTime paymentDate;
        public String transactionId;
        public String receiptNumber;
    }
}
