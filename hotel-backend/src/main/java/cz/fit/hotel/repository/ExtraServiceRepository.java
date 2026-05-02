package cz.fit.hotel.repository;

import cz.fit.hotel.model.ExtraService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.util.List;

@ApplicationScoped
public class ExtraServiceRepository {

    @PersistenceContext(unitName = "hotelPU")
    private EntityManager em;

    public List<ExtraService> findAll() {
        return em.createQuery("select es from ExtraService es order by es.name", ExtraService.class).getResultList();
    }

    public ExtraService findById(Long id) {
        return em.find(ExtraService.class, id);
    }

    public ExtraService findByName(String name) {
        List<ExtraService> result = em.createQuery("select es from ExtraService es where es.name = :name", ExtraService.class)
                .setParameter("name", name)
                .setMaxResults(1)
                .getResultList();

        return result.isEmpty() ? null : result.get(0);
    }

    public void save(ExtraService service) {
        em.persist(service);
    }

    public ExtraService update(ExtraService service) {
        return em.merge(service);
    }

    public void delete(ExtraService service) {
        ExtraService managed = em.merge(service);
        em.remove(managed);
    }

    public boolean isServiceUsed(Long serviceId) {
        Long count = em.createQuery("select count(res) from ReservationExtraService res where res.service.id = :id", Long.class)
                .setParameter("id", serviceId)
                .getSingleResult();
        return count > 0;
    }
}