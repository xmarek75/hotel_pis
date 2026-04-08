package cz.fit.hotel.business;

import cz.fit.hotel.model.Payment;
import cz.fit.hotel.model.PaymentMethod;
import cz.fit.hotel.model.PaymentStatus;
import cz.fit.hotel.model.Reservation;
import cz.fit.hotel.model.CardPayment;
import cz.fit.hotel.model.CashPayment;
import cz.fit.hotel.repository.PaymentRepository;
import cz.fit.hotel.repository.ReservationRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@ApplicationScoped
public class PaymentManager {

    @Inject
    PaymentRepository paymentRepository;

    @Inject
    ReservationRepository reservationRepository;

    @Inject
    ReservationManager reservationManager;

    public List<Payment> findAll() {
        return paymentRepository.findAll();
    }

    public Payment findById(Long id) {
        return paymentRepository.findById(id);
    }

    @Transactional
    public Payment create(Payment payment) {
        if (payment == null) {
            throw new IllegalArgumentException("Payment payload is required");
        }
        if (payment.getReservation() == null || payment.getReservation().getId() == null) {
            throw new IllegalArgumentException("Reservation is required");
        }
        if (payment.getAmount() == null || payment.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than 0");
        }
        if (payment.getPaymentMethod() == null) {
            throw new IllegalArgumentException("Payment method is required");
        }

        Reservation reservation = reservationRepository.findById(payment.getReservation().getId());
        if (reservation == null) {
            throw new IllegalArgumentException("Reservation not found");
        }

        Payment managedPayment = materializePayment(payment);
        managedPayment.setAmount(payment.getAmount());
        managedPayment.setPaymentMethod(payment.getPaymentMethod());
        managedPayment.setStatus(payment.getStatus() == null ? PaymentStatus.PENDING : payment.getStatus());
        managedPayment.setPaymentDate(payment.getPaymentDate());
        payment.setReservation(reservation);
        managedPayment.setReservation(reservation);
        if (managedPayment.getPaymentDate() == null) {
            managedPayment.setPaymentDate(LocalDateTime.now());
        }
        if (!managedPayment.processPayment()) {
            throw new IllegalArgumentException("Payment details are invalid for the selected payment type");
        }

        paymentRepository.save(managedPayment);
        reservationManager.refreshPaymentStatus(reservation.getId());
        return managedPayment;
    }

    @Transactional
    public void delete(Long id) {
        Payment payment = paymentRepository.findById(id);
        if (payment == null) {
            throw new IllegalArgumentException("Payment not found");
        }
        Long reservationId = payment.getReservation().getId();
        paymentRepository.delete(payment);
        reservationManager.refreshPaymentStatus(reservationId);
    }

    private Payment materializePayment(Payment payment) {
        if (payment instanceof CardPayment || payment instanceof CashPayment) {
            return payment;
        }

        if (payment.getPaymentMethod() == PaymentMethod.CARD) {
            CardPayment cardPayment = new CardPayment();
            cardPayment.setTransactionId("TXN-" + System.currentTimeMillis());
            return cardPayment;
        }
        if (payment.getPaymentMethod() == PaymentMethod.CASH) {
            CashPayment cashPayment = new CashPayment();
            cashPayment.setReceiptNumber("RCPT-" + System.currentTimeMillis());
            return cashPayment;
        }
        throw new IllegalArgumentException("Unsupported payment method");
    }
}
