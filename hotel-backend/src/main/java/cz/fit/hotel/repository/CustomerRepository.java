package cz.fit.hotel.repository;

import cz.fit.hotel.model.Customer;
import cz.fit.hotel.model.Reservation;
import cz.fit.hotel.model.ReservationStatus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.util.List;

@ApplicationScoped
public class CustomerRepository {

    @PersistenceContext(unitName = "hotelPU")
    private EntityManager em;

    public List<Customer> findAll() {
        return em.createQuery("select c from Customer c order by c.name", Customer.class)
                .getResultList();
    }

    public Customer findById(Long id) {
        return em.find(Customer.class, id);
    }

    public void save(Customer customer) {
        em.persist(customer);
    }

    public Customer update(Customer customer) {
        return em.merge(customer);
    }

    public void delete(Customer customer) {
        Customer managed = em.merge(customer);
        em.remove(managed);
    }

    public List<Reservation> findReservationsByCustomerId(Long customerId) {
        return em.createQuery("select r from Reservation r where r.customer.id = :customerId order by r.checkInDate desc", Reservation.class)
                .setParameter("customerId", customerId)
                .getResultList();
    }

    public long countReservations(Long customerId) {
        return em.createQuery("select count(r) from Reservation r where r.customer.id = :customerId", Long.class)
                .setParameter("customerId", customerId)
                .getSingleResult();
    }

    public Customer findByPhone(String phone) {
        List<Customer> result = em.createQuery("select c from Customer c where c.phone = :phone", Customer.class)
                .setParameter("phone", phone)
                .setMaxResults(1)
                .getResultList();

        return result.isEmpty() ? null : result.get(0);
    }

    public boolean hasActiveReservations(Long customerId) {
        Long count = em.createQuery("select count(r) from Reservation r where r.customer.id = :id and r.status <> :status", Long.class)
                .setParameter("id", customerId)
                .setParameter("status", ReservationStatus.CANCELED)
                .getSingleResult();

        return count > 0;
    }
}