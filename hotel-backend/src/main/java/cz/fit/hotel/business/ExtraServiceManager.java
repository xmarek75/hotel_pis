package cz.fit.hotel.business;

import cz.fit.hotel.model.ExtraService;
import cz.fit.hotel.repository.ExtraServiceRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

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
        if (service == null) {
            throw new IllegalArgumentException("Service payload is required");
        }
        extraServiceRepository.save(service);
        return service;
    }

    @Transactional
    public ExtraService update(Long id, ExtraService updatedService) {
        ExtraService existing = extraServiceRepository.findById(id);
        if (existing == null) {
            throw new IllegalArgumentException("Service not found");
        }
        existing.setName(updatedService.getName());
        existing.setPrice(updatedService.getPrice());
        existing.setDescription(updatedService.getDescription());
        return extraServiceRepository.update(existing);
    }

    @Transactional
    public void delete(Long id) {
        ExtraService existing = extraServiceRepository.findById(id);
        if (existing == null) {
            throw new IllegalArgumentException("Service not found");
        }
        extraServiceRepository.delete(existing);
    }
}
