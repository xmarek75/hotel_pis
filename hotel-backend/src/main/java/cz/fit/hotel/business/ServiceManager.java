package cz.fit.hotel.business;

import cz.fit.hotel.model.Service;
import cz.fit.hotel.repository.ServiceRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@ApplicationScoped
public class ServiceManager {

    @Inject
    ServiceRepository serviceRepository;

    public List<Service> findAll() {
        return serviceRepository.findAll();
    }

    public Service findById(Long id) {
        return serviceRepository.findById(id);
    }

    @Transactional
    public Service create(Service service) {
        validate(service);
        serviceRepository.save(service);
        return service;
    }

    @Transactional
    public Service update(Long id, Service payload) {
        Service service = serviceRepository.findById(id);
        if (service == null) {
            throw new IllegalArgumentException("Service not found");
        }

        if (payload.getName() != null && !payload.getName().isBlank()) {
            service.setName(payload.getName());
        }
        if (payload.getDescription() != null && !payload.getDescription().isBlank()) {
            service.setDescription(payload.getDescription());
        }
        if (payload.getPrice() != null) {
            service.setPrice(payload.getPrice());
        }

        validate(service);
        return serviceRepository.update(service);
    }

    @Transactional
    public void delete(Long id) {
        Service service = serviceRepository.findById(id);
        if (service == null) {
            throw new IllegalArgumentException("Service not found");
        }

        List<Long> reservationIds = service.getServiceItems().stream()
                .map(item -> item != null && item.getReservation() != null ? item.getReservation().getId() : null)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .sorted(Comparator.naturalOrder())
                .collect(Collectors.toList());

        if (!reservationIds.isEmpty()) {
            throw new IllegalArgumentException(
                    "Service cannot be deleted because it is assigned to reservations: "
                            + reservationIds.stream().map(String::valueOf).collect(Collectors.joining(", "))
            );
        }

        serviceRepository.delete(service);
    }

    private void validate(Service service) {
        if (service.getName() == null || service.getName().isBlank()) {
            throw new IllegalArgumentException("Service name is required");
        }
        if (service.getDescription() == null || service.getDescription().isBlank()) {
            throw new IllegalArgumentException("Service description is required");
        }
        if (service.getPrice() == null || service.getPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Service price must be >= 0");
        }
    }
}
