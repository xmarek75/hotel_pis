package cz.fit.hotel.repository;

import cz.fit.hotel.model.Payment;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.math.BigDecimal;
import java.util.List;

@ApplicationScoped
public class PaymentRepository {

    @PersistenceContext(unitName = "hotelPU")
    private EntityManager em;

    public List<Payment> findAll() {
        return em.createQuery("select p from Payment p order by p.paymentDate desc", Payment.class)
                .getResultList();
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
        em.remove(payment);
    }

    public BigDecimal sumByReservationId(Long reservationId) {
        BigDecimal value = em.createQuery(
                        "select coalesce(sum(p.amount), 0) from Payment p where p.reservation.id = :reservationId and p.status <> cz.fit.hotel.model.PaymentStatus.REFUNDED",
                        BigDecimal.class
                )
                .setParameter("reservationId", reservationId)
                .getSingleResult();
        return value == null ? BigDecimal.ZERO : value;
    }
}
