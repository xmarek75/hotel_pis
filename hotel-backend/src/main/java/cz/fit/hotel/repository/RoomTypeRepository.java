package cz.fit.hotel.repository;

import cz.fit.hotel.model.RoomType;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.util.List;

@ApplicationScoped
public class RoomTypeRepository {

    @PersistenceContext(unitName = "hotelPU")
    private EntityManager em;

    public void save(RoomType type) {
        em.persist(type);
    }

    public RoomType update(RoomType type) {
        return em.merge(type);
    }

    public void delete(RoomType type) {
        RoomType managed = em.merge(type);
        em.remove(managed);
    }

    public List<RoomType> findAll() {
        return em.createQuery("select rt from RoomType rt order by rt.name", RoomType.class)
                .getResultList();
    }

    public RoomType findById(Long id) {
        return em.find(RoomType.class, id);
    }

    public RoomType findByName(String name) {
        List<RoomType> result = em.createQuery("select rt from RoomType rt where rt.name = :name", RoomType.class)
                .setParameter("name", name)
                .setMaxResults(1)
                .getResultList();

        return result.isEmpty() ? null : result.get(0);
    }
}