package cz.fit.hotel.business;

import cz.fit.hotel.model.ExtraService;
import cz.fit.hotel.repository.ExtraServiceRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.math.BigDecimal;
import java.util.List;

@ApplicationScoped
public class ExtraServiceManager {

    @Inject
    ExtraServiceRepository extraServiceRepository;

    public List<ExtraService> findAll() {
        return extraServiceRepository.findAll();
    }

    public ExtraService findById(Long id) {
        return extraServiceRepository.findById(id);
    }

    @Transactional
    public ExtraService create(ExtraService service) {
        validate(service);
        
        if (extraServiceRepository.findByName(service.getName()) != null) {
            throw new IllegalArgumentException("Service with this name already exists");
        }

        extraServiceRepository.save(service);
        return service;
    }

    @Transactional
    public ExtraService update(Long id, ExtraService payload) {
        ExtraService service = requireService(id);

        if (payload.getName() != null && !payload.getName().isBlank()) {
            ExtraService existing = extraServiceRepository.findByName(payload.getName());
            if (existing != null && !existing.getId().equals(id)) {
                throw new IllegalArgumentException("Service with this name already exists");
            }
            service.setName(payload.getName());
        }

        if (payload.getPrice() != null) {
            service.setPrice(payload.getPrice());
        }

        if (payload.getDescription() != null) {
            service.setDescription(payload.getDescription());
        }

        validate(service);
        return extraServiceRepository.update(service);
    }

    @Transactional
    public void delete(Long id) {
        ExtraService service = requireService(id);

        if (extraServiceRepository.isServiceUsed(id)) {
            throw new IllegalArgumentException("Cannot delete service that is linked to reservations. Consider changing its name instead.");
        }

        extraServiceRepository.delete(service);
    }

    private void validate(ExtraService service) {
        if (service.getName() == null || service.getName().isBlank()) {
            throw new IllegalArgumentException("Service name is required");
        }
        if (service.getPrice() == null || service.getPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Service price must be non-negative");
        }
    }

    private ExtraService requireService(Long id) {
        ExtraService service = extraServiceRepository.findById(id);
        if (service == null) {
            throw new IllegalArgumentException("Service not found");
        }
        return service;
    }
}
