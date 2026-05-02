package cz.fit.hotel.repository;

import cz.fit.hotel.model.RoomService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.util.List;

@ApplicationScoped
public class RoomServiceRepository {

    @PersistenceContext(unitName = "hotelPU")
    private EntityManager em;

    public List<RoomService> findAll() {
        return em.createQuery("select rs from RoomService rs order by rs.name", RoomService.class).getResultList();
    }

    public RoomService findById(Long id) {
        return em.find(RoomService.class, id);
    }

    public RoomService findByName(String name) {
        List<RoomService> result = em.createQuery("select rs from RoomService rs where rs.name = :name", RoomService.class)
                .setParameter("name", name)
                .setMaxResults(1)
                .getResultList();

        return result.isEmpty() ? null : result.get(0);
    }

    public void save(RoomService service) {
        em.persist(service);
    }

    public RoomService update(RoomService service) {
        return em.merge(service);
    }

    public void delete(RoomService service) {
        RoomService managed = em.merge(service);
        em.remove(managed);
    }

    public boolean isServiceUsed(Long serviceId) {
        Long count = em.createQuery("select count(r) from Room r join r.services s where s.id = :id", Long.class)
                .setParameter("id", serviceId)
                .getSingleResult();
        return count > 0;
    }
}