package cz.fit.hotel.business;

import cz.fit.hotel.model.Payment;
import cz.fit.hotel.model.Reservation;
import cz.fit.hotel.model.Employee;
import cz.fit.hotel.repository.PaymentRepository;
import cz.fit.hotel.repository.ReservationRepository;
import cz.fit.hotel.repository.EmployeeRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.math.BigDecimal;
import java.util.List;

@ApplicationScoped
public class PaymentManager {

    @Inject
    PaymentRepository paymentRepository;

    @Inject
    ReservationRepository reservationRepository;
    
    @Inject
    EmployeeRepository employeeRepository;

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
        Employee employee = requireEmployee(payment.getEmployee().getId());
        
        BigDecimal currentTotalPaid = paymentRepository.getTotalPaidForReservation(reservation.getId());
        BigDecimal totalCost = reservationManager.calculateTotalPrice(reservation);
        if (currentTotalPaid.add(payment.getAmount()).compareTo(totalCost) > 0) {
            throw new IllegalArgumentException("Payment amount exceeds the total reservation cost. Remaining to pay: " + totalCost.subtract(currentTotalPaid));
        }

        Payment managedPayment = payment;
        managedPayment.setAmount(payment.getAmount());
        
        payment.setReservation(reservation);
        managedPayment.setReservation(reservation);
        
        payment.setEmployee(employee);
        managedPayment.setEmployee(employee);
        
        // No explicit status/processPayment validation per the updated Payment model.
        // The PrePersist generates the date automatically or it defaults to current time.

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
        if (payment.getMethod() == null) {
            throw new IllegalArgumentException("Payment method is required");
        }
        if (payment.getEmployee() == null || payment.getEmployee().getId() == null) {
            throw new IllegalArgumentException("Employee is required");
        }
    }

    private Reservation requireReservation(Long reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId);
        if (reservation == null) {
            throw new IllegalArgumentException("Reservation not found");
        }
        return reservation;
    }

    private Employee requireEmployee(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId);
        if (employee == null || !employee.isActive()) {
            throw new IllegalArgumentException("Employee not found or inactive");
        }
        return employee;
    }

    private Payment requirePayment(Long id) {
        Payment payment = paymentRepository.findById(id);
        if (payment == null) {
            throw new IllegalArgumentException("Payment not found");
        }
        return payment;
    }
}
