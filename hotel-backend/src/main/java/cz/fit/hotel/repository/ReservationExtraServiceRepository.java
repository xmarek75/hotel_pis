package cz.fit.hotel.repository;

import cz.fit.hotel.model.ReservationExtraService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.util.List;
import java.math.BigDecimal;

@ApplicationScoped
public class ReservationExtraServiceRepository {

    @PersistenceContext(unitName = "hotelPU")
    private EntityManager em;

    public ReservationExtraService findById(Long id) {
        return em.find(ReservationExtraService.class, id);
    }

    public void save(ReservationExtraService item) {
        em.persist(item);
    }

    public ReservationExtraService update(ReservationExtraService item) {
        return em.merge(item);
    }

    public void delete(ReservationExtraService item) {
        ReservationExtraService managed = em.merge(item);
        em.remove(managed);
    }

    public List<ReservationExtraService> findByReservationId(Long reservationId) {
        return em.createQuery(
                        "select r from ReservationExtraService r where r.reservation.id = :reservationId", ReservationExtraService.class)
                .setParameter("reservationId", reservationId)
                .getResultList();
    }

    public BigDecimal getTotalPriceForServices(Long reservationId) {
        BigDecimal result = em.createQuery(
                        "select coalesce(sum(r.priceAtTime * r.quantity), 0.0) from ReservationExtraService r where r.reservation.id = :reservationId",
                        BigDecimal.class)
                .setParameter("reservationId", reservationId)
                .getSingleResult();

        return result;
    }
}