package cz.fit.hotel.repository;

import cz.fit.hotel.model.Reservation;
import cz.fit.hotel.model.ReservationStatus;
import cz.fit.hotel.model.PaymentStatus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.time.LocalDate;
import java.util.List;

@ApplicationScoped
public class ReservationRepository {

    @PersistenceContext(unitName = "hotelPU")
    private EntityManager em;

    public List<Reservation> findAll() {
        return em.createQuery(
                        "select distinct r from Reservation r " +
                                "left join fetch r.room room " +
                                "left join fetch room.type " +
                                "left join fetch r.customer " +
                                "left join fetch r.employee " +
                                "left join fetch r.extraServices es " +
                                "left join fetch es.service " +
                                "order by r.createdAt desc",
                        Reservation.class
                )
                .getResultList();
    }

    public Reservation findById(Long id) {
        List<Reservation> matches = em.createQuery(
                        "select distinct r from Reservation r " +
                                "left join fetch r.room room " +
                                "left join fetch room.type " +
                                "left join fetch r.customer " +
                                "left join fetch r.employee " +
                                "left join fetch r.extraServices es " +
                                "left join fetch es.service " +
                                "where r.id = :id",
                        Reservation.class
                )
                .setParameter("id", id)
                .setMaxResults(1)
                .getResultList();
        return matches.isEmpty() ? null : matches.get(0);
    }

    public void save(Reservation reservation) {
        em.persist(reservation);
    }

    public Reservation update(Reservation reservation) {
        return em.merge(reservation);
    }

    public void delete(Reservation reservation) {
        Reservation managed = em.merge(reservation);
        em.remove(managed);
    }

    public LocalDate findLastCheckoutByCustomerId(Long customerId) {
        List<LocalDate> values = em.createQuery(
                        "select r.checkOutDate from Reservation r where r.customer.id = :customerId order by r.checkOutDate desc",
                        LocalDate.class
                )
                .setParameter("customerId", customerId)
                .setMaxResults(1)
                .getResultList();
        return values.isEmpty() ? null : values.get(0);
    }

    public List<Reservation> findByCustomerId(Long customerId) {
        return em.createQuery(
                        "select r from Reservation r where r.customer.id = :customerId order by r.checkInDate desc",
                        Reservation.class
                )
                .setParameter("customerId", customerId)
                .getResultList();
    }

    public boolean hasActiveReservation(Long customerId) {
        Long count = em.createQuery(
                        "select count(r) from Reservation r where r.customer.id = :customerId and r.status not in :closedStatuses",
                        Long.class
                )
                .setParameter("customerId", customerId)
                .setParameter("closedStatuses", java.util.List.of(ReservationStatus.CANCELED, ReservationStatus.CHECKED_OUT))
                .getSingleResult();
        return count != null && count > 0;
    }

    public boolean hasRoomOverlapExcludingReservation(Long roomId, LocalDate from, LocalDate to, Long excludeReservationId) {
        Long count = em.createQuery(
                        "select count(r) from Reservation r where r.room.id = :roomId and r.id <> :excludeId " +
                                "and r.status <> cz.fit.hotel.model.ReservationStatus.CANCELED " +
                                "and r.checkInDate < :toDate and r.checkOutDate > :fromDate", Long.class)
                .setParameter("roomId", roomId)
                .setParameter("excludeId", excludeReservationId)
                .setParameter("fromDate", from)
                .setParameter("toDate", to)
                .getSingleResult();
        return count != null && count > 0;
    }

    public List<Reservation> findByEmployeeId(Long employeeId) {
        return em.createQuery("select r from Reservation r where r.employee.id = :employeeId order by r.createdAt desc", Reservation.class)
                .setParameter("employeeId", employeeId)
                .getResultList();
    }

    public List<Reservation> findByStatus(ReservationStatus status) {
        return em.createQuery("select r from Reservation r where r.status = :status order by r.createdAt desc", Reservation.class)
                .setParameter("status", status)
                .getResultList();
    }

    public List<Reservation> findByPaymentStatus(PaymentStatus status) {
        return em.createQuery("select r from Reservation r where r.paymentStatus = :status order by r.createdAt desc", Reservation.class)
                .setParameter("status", status)
                .getResultList();
    }

    public List<Reservation> findBetweenDates(LocalDate from, LocalDate to) {
        return em.createQuery("select r from Reservation r where r.checkInDate <= :to and r.checkOutDate >= :from order by r.checkInDate", Reservation.class)
                .setParameter("from", from)
                .setParameter("to", to)
                .getResultList();
    }
}
