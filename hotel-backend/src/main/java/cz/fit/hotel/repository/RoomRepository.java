package cz.fit.hotel.repository;

import cz.fit.hotel.model.Room;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

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

    public void delete(Room room) {
        Room managed = em.merge(room);
        em.remove(managed);
    }

    public List<Room> findByTypeName(String typeName) {
        return em.createQuery("select r from Room r where r.type.name = :name order by r.number", Room.class)
                .setParameter("name", typeName)
                .getResultList();
    }

    public List<Room> findByTypeId(Long typeId) {
        return em.createQuery("select r from Room r where r.type.id = :typeId order by r.number", Room.class)
                .setParameter("typeId", typeId)
                .getResultList();
    }

    public List<Room> findByAllServiceIds(List<Long> serviceIds) {
        if (serviceIds == null || serviceIds.isEmpty()) {
            return findAll();
        }

        return em.createQuery("select r from Room r join r.services s where s.id in :serviceIds group by r.id having count(distinct s.id) = :size",Room.class)
                .setParameter("serviceIds", serviceIds)
                .setParameter("size", (long) serviceIds.size())
                .getResultList();
    }

    public List<Room> findByCapacity(int guests) {
        return em.createQuery("select r from Room r where r.capacity >= :guests", Room.class)
                .setParameter("guests", guests)
                .getResultList();
    }

}