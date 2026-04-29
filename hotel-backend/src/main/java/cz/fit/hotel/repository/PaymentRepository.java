package cz.fit.hotel.repository;

import cz.fit.hotel.model.Payment;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.util.List;

@ApplicationScoped
public class PaymentRepository {

    @PersistenceContext(unitName = "hotelPU")
    private EntityManager em;

    public List<Payment> findAll() {
        return em.createQuery("select p from Payment p order by p.paymentDate desc", Payment.class).getResultList();
    }

    public Payment findById(Long id) {
        return em.find(Payment.class, id);
    }

    public void save(Payment payment) {
        em.persist(payment);
    }

    public Payment update(Payment payment) {
        return em.merge(payment);
    }

    public void delete(Payment payment) {
        Payment managed = em.merge(payment);
        em.remove(managed);
    }

    public List<Payment> findByReservationId(Long reservationId) {
        return em.createQuery("select p from Payment p where p.reservation.id = :reservationId order by p.paymentDate desc", Payment.class)
                .setParameter("reservationId", reservationId)
                .getResultList();
    }

    public List<Payment> findByEmployeeId(Long employeeId) {
        return em.createQuery("select p from Payment p where p.employee.id = :employeeId order by p.paymentDate desc", Payment.class)
                .setParameter("employeeId", employeeId)
                .getResultList();
    }

    public java.math.BigDecimal getTotalPaidForReservation(Long reservationId) {
        java.math.BigDecimal result = em.createQuery(
                        "select sum(p.amount) from Payment p where p.reservation.id = :reservationId",
                        java.math.BigDecimal.class)
                .setParameter("reservationId", reservationId)
                .getSingleResult();

        return result != null ? result : java.math.BigDecimal.ZERO;
    }
}
