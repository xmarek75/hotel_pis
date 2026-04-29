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
        validate(service, null);
        extraServiceRepository.save(service);
        return service;
    }

    @Transactional
    public ExtraService update(Long id, ExtraService payload) {
        ExtraService existing = requireService(id);
        validate(payload, id);

        existing.setName(payload.getName().trim());
        existing.setDescription(payload.getDescription().trim());
        existing.setPrice(payload.getPrice());
        return extraServiceRepository.update(existing);
    }

    @Transactional
    public void delete(Long id) {
        ExtraService existing = requireService(id);
        extraServiceRepository.delete(existing);
    }

    private ExtraService requireService(Long id) {
        ExtraService service = extraServiceRepository.findById(id);
        if (service == null) {
            throw new IllegalArgumentException("Service not found");
        }
        return service;
    }

    private void validate(ExtraService service, Long currentId) {
        if (service == null) {
            throw new IllegalArgumentException("Service payload is required");
        }
        if (service.getName() == null || service.getName().isBlank()) {
            throw new IllegalArgumentException("Service name is required");
        }
        if (service.getDescription() == null || service.getDescription().isBlank()) {
            throw new IllegalArgumentException("Service description is required");
        }
        if (service.getPrice() == null || service.getPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Service price must be greater than or equal to 0");
        }

        ExtraService sameName = extraServiceRepository.findByName(service.getName().trim());
        if (sameName != null && (currentId == null || !sameName.getId().equals(currentId))) {
            throw new IllegalArgumentException("Service with this name already exists");
        }

        service.setName(service.getName().trim());
        service.setDescription(service.getDescription().trim());
    }
}
