package cz.fit.hotel.business;

import cz.fit.hotel.model.Employee;
import cz.fit.hotel.repository.EmployeeRepository;
import cz.fit.hotel.security.PasswordHasher;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.List;

@ApplicationScoped
public class EmployeeManager {

    @Inject
    EmployeeRepository employeeRepository;

    @Inject
    PasswordHasher passwordHasher;

    public List<Employee> findAll() {
        return employeeRepository.findAll();
    }

    public Employee findById(Long id) {
        return employeeRepository.findById(id);
    }

    @Transactional
    public Employee create(Employee employee) {
        validate(employee);
        if (employeeRepository.findByUsername(employee.getUsername()) != null) {
            throw new IllegalArgumentException("Username already exists");
        }
        employee.setPassword(passwordHasher.hash(employee.getPassword()));
        employeeRepository.save(employee);
        return employee;
    }

    @Transactional
    public Employee update(Long id, Employee payload) {
        Employee employee = employeeRepository.findById(id);
        if (employee == null) {
            throw new IllegalArgumentException("Employee not found");
        }

        if (payload.getName() != null && !payload.getName().isBlank()) {
            employee.setName(payload.getName());
        }
        if (payload.getUsername() != null && !payload.getUsername().isBlank()) {
            Employee sameUsername = employeeRepository.findByUsername(payload.getUsername());
            if (sameUsername != null && !sameUsername.getId().equals(id)) {
                throw new IllegalArgumentException("Username already exists");
            }
            employee.setUsername(payload.getUsername());
        }
        if (payload.getContact() != null && !payload.getContact().isBlank()) {
            employee.setContact(payload.getContact());
        }
        if (payload.getPassword() != null && !payload.getPassword().isBlank()) {
            employee.setPassword(passwordHasher.hash(payload.getPassword()));
        }
        if (payload.getRole() != null) {
            employee.setRole(payload.getRole());
        }
        validate(employee);
        return employeeRepository.update(employee);
    }

    @Transactional
    public void delete(Long id) {
        Employee employee = employeeRepository.findById(id);
        if (employee == null) {
            throw new IllegalArgumentException("Employee not found");
        }
        employee.setActive(false);
        employeeRepository.update(employee);
    }

    private void validate(Employee employee) {
        if (employee.getName() == null || employee.getName().isBlank()) {
            throw new IllegalArgumentException("Employee name is required");
        }
        if (employee.getUsername() == null || employee.getUsername().isBlank()) {
            throw new IllegalArgumentException("Employee username is required");
        }
        if (employee.getPassword() == null || employee.getPassword().isBlank()) {
            throw new IllegalArgumentException("Employee password is required");
        }
        if (employee.getRole() == null) {
            throw new IllegalArgumentException("Employee role is required");
        }
    }
}
