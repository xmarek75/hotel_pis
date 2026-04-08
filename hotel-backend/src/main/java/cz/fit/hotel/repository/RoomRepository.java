package cz.fit.hotel.repository;

import cz.fit.hotel.model.Room;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.time.LocalDate;
import java.util.List;

@ApplicationScoped
public class RoomRepository {

    @PersistenceContext(unitName = "hotelPU")
    private EntityManager em;

    public List<Room> findAll() {
        return em.createQuery("select r from Room r order by r.number", Room.class)
                .getResultList();
    }

    public Room findById(Long id) {
        return em.find(Room.class, id);
    }

    public Room findByNumber(String number) {
        List<Room> rooms = em.createQuery("select r from Room r where r.number = :number", Room.class)
                .setParameter("number", number)
                .setMaxResults(1)
                .getResultList();
        return rooms.isEmpty() ? null : rooms.get(0);
    }

    public void save(Room room) {
        em.persist(room);
    }

    public Room update(Room room) {
        return em.merge(room);
    }

    public long findUnavailableRoomsCount(Long roomId, LocalDate from, LocalDate to) {
        return em.createQuery(
                        "select count(r) from Reservation r " +
                                "where r.room.id = :roomId " +
                                "and r.status <> cz.fit.hotel.model.ReservationStatus.CANCELED " +
                                "and r.checkInDate < :toDate and r.checkOutDate > :fromDate",
                        Long.class
                )
                .setParameter("roomId", roomId)
                .setParameter("fromDate", from)
                .setParameter("toDate", to)
                .getSingleResult();
    }
}
