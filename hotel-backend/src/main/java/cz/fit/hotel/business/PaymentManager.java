package cz.fit.hotel.business;

import cz.fit.hotel.model.Payment;
import cz.fit.hotel.model.PaymentStatus;
import cz.fit.hotel.model.Reservation;
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
        validateCreateRequest(payment);

        Reservation reservation = requireReservation(payment.getReservation().getId());
        Payment managedPayment = payment;
        managedPayment.setAmount(payment.getAmount());
        managedPayment.setStatus(payment.getStatus() == null ? PaymentStatus.PENDING : payment.getStatus());
        managedPayment.setPaymentDate(payment.getPaymentDate());
        payment.setReservation(reservation);
        managedPayment.setReservation(reservation);
        if (managedPayment.getPaymentDate() == null) {
            managedPayment.setPaymentDate(LocalDateTime.now());
        }
        // processPayment zde nevola externi platebni branu, jen overi, ze konkretni typ platby
        // ma potrebna pole a synchronizuje finalni status.
        if (!managedPayment.processPayment()) {
            throw new IllegalArgumentException("Payment details are invalid for the selected payment type");
        }

        paymentRepository.save(managedPayment);
        reservationManager.refreshPaymentStatus(reservation.getId());
        return managedPayment;
    }

    @Transactional
    public void delete(Long id) {
        Payment payment = requirePayment(id);
        Long reservationId = payment.getReservation().getId();
        paymentRepository.delete(payment);
        reservationManager.refreshPaymentStatus(reservationId);
    }

    private void validateCreateRequest(Payment payment) {
        if (payment == null) {
            throw new IllegalArgumentException("Payment payload is required");
        }
        if (payment.getReservation() == null || payment.getReservation().getId() == null) {
            throw new IllegalArgumentException("Reservation is required");
        }
        if (payment.getAmount() == null || payment.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than 0");
        }
    }

    private Reservation requireReservation(Long reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId);
        if (reservation == null) {
            throw new IllegalArgumentException("Reservation not found");
        }
        return reservation;
    }

    private Payment requirePayment(Long id) {
        Payment payment = paymentRepository.findById(id);
        if (payment == null) {
            throw new IllegalArgumentException("Payment not found");
        }
        return payment;
    }
}
