package cz.fit.hotel.business;

import cz.fit.hotel.model.Customer;
import cz.fit.hotel.model.CustomerDetails;
import cz.fit.hotel.model.Reservation;
import cz.fit.hotel.repository.CustomerRepository;
import cz.fit.hotel.repository.ReservationRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.LocalDate;
import java.util.List;

@ApplicationScoped
public class CustomerManager {

    @Inject
    CustomerRepository customerRepository;

    @Inject
    ReservationRepository reservationRepository;

    public List<Customer> findAll() {
        return customerRepository.findAll();
    }

    public Customer findById(Long id) {
        return customerRepository.findById(id);
    }

    public CustomerDetails getDetails(Long customerId) {
        Customer customer = customerRepository.findById(customerId);
        if (customer == null) {
            throw new IllegalArgumentException("Customer not found");
        }

        long reservationCount = customerRepository.countReservations(customerId);
        LocalDate lastStayDate = reservationRepository.findLastCheckoutByCustomerId(customerId);
        boolean hasActive = reservationRepository.hasActiveReservation(customerId);
        List<Reservation> reservations = reservationRepository.findByCustomerId(customerId);

        return new CustomerDetails(customer, reservationCount, lastStayDate, hasActive, reservations);
    }

    @Transactional
    public Customer create(Customer customer) {
        validate(customer);
        customerRepository.save(customer);
        return customer;
    }

    @Transactional
    public Customer update(Long id, Customer payload) {
        Customer customer = customerRepository.findById(id);
        if (customer == null) {
            throw new IllegalArgumentException("Customer not found");
        }

        if (payload.getName() != null && !payload.getName().isBlank()) {
            customer.setName(payload.getName());
        }
        if (payload.getDateOfBirth() != null) {
            customer.setDateOfBirth(payload.getDateOfBirth());
        }
        if (payload.getEmail() != null && !payload.getEmail().isBlank()) {
            customer.setEmail(payload.getEmail());
        }
        if (payload.getPhone() != null && !payload.getPhone().isBlank()) {
            customer.setPhone(payload.getPhone());
        }

        validate(customer);
        return customerRepository.update(customer);
    }

    @Transactional
    public void delete(Long id) {
        Customer customer = customerRepository.findById(id);
        if (customer == null) {
            throw new IllegalArgumentException("Customer not found");
        }
        customerRepository.delete(customer);
    }

    private void validate(Customer customer) {
        if (customer.getName() == null || customer.getName().isBlank()) {
            throw new IllegalArgumentException("Customer name is required");
        }
        if (customer.getDateOfBirth() == null) {
            throw new IllegalArgumentException("Customer dateOfBirth is required");
        }
        if (customer.getDateOfBirth().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Customer dateOfBirth must not be in the future");
        }
        if (customer.getEmail() == null || customer.getEmail().isBlank()) {
            throw new IllegalArgumentException("Customer email is required");
        }
        if (customer.getPhone() == null || customer.getPhone().isBlank()) {
            throw new IllegalArgumentException("Customer phone is required");
        }
    }
}
