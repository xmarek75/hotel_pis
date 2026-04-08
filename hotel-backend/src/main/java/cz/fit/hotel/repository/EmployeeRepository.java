package cz.fit.hotel.repository;

import cz.fit.hotel.model.Employee;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.util.List;

@ApplicationScoped
public class EmployeeRepository {

    @PersistenceContext(unitName = "hotelPU")
    private EntityManager em;

    public List<Employee> findAll() {
        return em.createQuery("select e from Employee e order by e.name", Employee.class)
                .getResultList();
    }

    public Employee findById(Long id) {
        return em.find(Employee.class, id);
    }

    public Employee findByUsername(String username) {
        List<Employee> result = em.createQuery("select e from Employee e where e.username = :username", Employee.class)
                .setParameter("username", username)
                .setMaxResults(1)
                .getResultList();
        return result.isEmpty() ? null : result.get(0);
    }

    public Employee findFirstActive() {
        List<Employee> result = em.createQuery("select e from Employee e where e.active = true order by e.id", Employee.class)
                .setMaxResults(1)
                .getResultList();
        return result.isEmpty() ? null : result.get(0);
    }

    public void save(Employee employee) {
        em.persist(employee);
    }

    public Employee update(Employee employee) {
        return em.merge(employee);
    }

    public void delete(Employee employee) {
        em.remove(employee);
    }
}
