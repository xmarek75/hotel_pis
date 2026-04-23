package cz.fit.hotel.repository;

import cz.fit.hotel.model.ReservationChangeLog;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.util.List;

@ApplicationScoped
public class ReservationChangeLogRepository {

    @PersistenceContext(unitName = "hotelPU")
    private EntityManager em;

    public ReservationChangeLog findById(Long id) {
        return em.find(ReservationChangeLog.class, id);
    }

    public void save(ReservationChangeLog log) {
        em.persist(log);
    }

    public ReservationChangeLog update(ReservationChangeLog log) {
        return em.merge(log);
    }

    public void delete(ReservationChangeLog log) {
        ReservationChangeLog managed = em.merge(log);
        em.remove(managed);
    }

    public List<ReservationChangeLog> findByReservationId(Long reservationId) {
        return em.createQuery("select l from ReservationChangeLog l where l.reservation.id = :reservationId order by l.changedAt desc",
                        ReservationChangeLog.class)
                .setParameter("reservationId", reservationId)
                .getResultList();
    }

    public List<ReservationChangeLog> findByEmployeeId(Long employeeId) {
        return em.createQuery("select l from ReservationChangeLog l where l.employee.id = :employeeId order by l.changedAt desc",
                        ReservationChangeLog.class)
                .setParameter("employeeId", employeeId)
                .getResultList();
    }
}