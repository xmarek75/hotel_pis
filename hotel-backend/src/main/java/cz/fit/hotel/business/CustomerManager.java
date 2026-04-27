package cz.fit.hotel.business;

import cz.fit.hotel.model.Customer;
import cz.fit.hotel.repository.CustomerRepository;
import cz.fit.hotel.repository.ReservationRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.regex.Pattern;

@ApplicationScoped
public class CustomerManager {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^\\+?[0-9]{9,15}$");

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

    @Transactional
    public Customer create(Customer customer) {
        // Validate required fields and formats
        validate(customer);

        // Check unique phone number
        if (customerRepository.findByPhone(customer.getPhone()) != null) {
            throw new IllegalArgumentException("Customer with this phone number already exists.");
        }

        customerRepository.save(customer);
        return customer;
    }

    @Transactional
    public Customer update(Long id, Customer payload) {
        Customer customer = requireCustomer(id);

        if (payload.getName() != null && !payload.getName().isBlank()) {
            customer.setName(payload.getName());
        }
        if (payload.getDateOfBirth() != null) {
            customer.setDateOfBirth(payload.getDateOfBirth());
        }
        
        // Handle optional email update
        if (payload.getEmail() != null && !payload.getEmail().isBlank()) {
            customer.setEmail(payload.getEmail());
        } else if (payload.getEmail() != null && payload.getEmail().isBlank()) {
            customer.setEmail(null); // Allow clearing email
        }

        if (payload.getPhone() != null && !payload.getPhone().isBlank()) {
            // Check unique phone when updating (ignore if it's the same customer)
            Customer existingWithPhone = customerRepository.findByPhone(payload.getPhone());
            if (existingWithPhone != null && !existingWithPhone.getId().equals(id)) {
                throw new IllegalArgumentException("Customer with this phone number already exists.");
            }
            customer.setPhone(payload.getPhone());
        }

        validate(customer);
        return customerRepository.update(customer);
    }

    @Transactional
    public void delete(Long id) {
        Customer customer = requireCustomer(id);
        
        // Business logic: do not allow deletion if the customer has an active reservation
        boolean hasActive = reservationRepository.hasActiveReservation(id);
        if (hasActive) {
            throw new IllegalArgumentException("Cannot delete customer with an active reservation");
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
        
        // phone requires validation: must exist and be in correct format
        if (customer.getPhone() == null || customer.getPhone().isBlank()) {
            throw new IllegalArgumentException("Customer phone is required");
        }
        if (!PHONE_PATTERN.matcher(customer.getPhone()).matches()) {
            throw new IllegalArgumentException("Invalid phone number format. It should contain 9 to 15 digits and can start with +");
        }

        // Email is optional (nullable), but if provided, it must be in a valid format.
        if (customer.getEmail() != null && !customer.getEmail().isBlank()) {
            if (!EMAIL_PATTERN.matcher(customer.getEmail()).matches()) {
                throw new IllegalArgumentException("Invalid email format");
            }
        }
    }

    private Customer requireCustomer(Long id) {
        Customer customer = customerRepository.findById(id);
        if (customer == null) {
            throw new IllegalArgumentException("Customer not found");
        }
        return customer;
    }
}
