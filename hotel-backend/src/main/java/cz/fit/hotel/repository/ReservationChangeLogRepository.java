package cz.fit.hotel.repository;

import cz.fit.hotel.model.ReservationChangeLog;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.List;

/**
 * Repository for managing ReservationChangeLog entities.
 */
@ApplicationScoped
public class ReservationChangeLogRepository {

    @PersistenceContext(unitName = "hotelPU")
    private EntityManager em;

    /**
     * Persists a new change log entry.
     */
    public void save(ReservationChangeLog log) {
        em.persist(log);
    }

    /**
     * Retrieves all change logs, ordered by date descending.
     */
    public List<ReservationChangeLog> findAll() {
        return em.createQuery("SELECT rcl FROM ReservationChangeLog rcl ORDER BY rcl.changeDate DESC", ReservationChangeLog.class)
                .getResultList();
    }

    /**
     * Retrieves all change logs for a specific reservation, ordered by date descending.
     */
    public List<ReservationChangeLog> findByReservationId(Long reservationId) {
        return em.createQuery(
                "SELECT rcl FROM ReservationChangeLog rcl " +
                "WHERE rcl.reservation.id = :reservationId " +
                "ORDER BY rcl.changeDate DESC", ReservationChangeLog.class)
                .setParameter("reservationId", reservationId)
                .getResultList();
    }
}