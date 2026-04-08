package cz.fit.hotel.repository;

import cz.fit.hotel.model.Service;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.util.List;

@ApplicationScoped
public class ServiceRepository {

    @PersistenceContext(unitName = "hotelPU")
    private EntityManager em;

    public List<Service> findAll() {
        return em.createQuery("select s from Service s order by s.name", Service.class)
                .getResultList();
    }

    public Service findById(Long id) {
        return em.find(Service.class, id);
    }

    public void save(Service service) {
        em.persist(service);
    }

    public Service update(Service service) {
        return em.merge(service);
    }

    public void delete(Service service) {
        em.remove(service);
    }
}
