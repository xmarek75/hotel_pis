package cz.fit.hotel.business;

import cz.fit.hotel.model.RoomService;
import cz.fit.hotel.repository.RoomServiceRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.List;

@ApplicationScoped
public class RoomServiceManager {

    @Inject
    RoomServiceRepository roomServiceRepository;

    public List<RoomService> findAll() {
        return roomServiceRepository.findAll();
    }

    public RoomService findById(Long id) {
        return roomServiceRepository.findById(id);
    }

    @Transactional
    public RoomService create(RoomService service) {
        validate(service);
        if (roomServiceRepository.findByName(service.getName()) != null) {
            throw new IllegalArgumentException("Room service with this name already exists");
        }
        roomServiceRepository.save(service);
        return service;
    }

    @Transactional
    public RoomService update(Long id, RoomService payload) {
        RoomService service = requireService(id);
        
        if (payload.getName() != null && !payload.getName().isBlank()) {
            RoomService existing = roomServiceRepository.findByName(payload.getName());
            if (existing != null && !existing.getId().equals(id)) {
                throw new IllegalArgumentException("Room service with this name already exists");
            }
            service.setName(payload.getName());
        }

        if (payload.getDescription() != null) {
            service.setDescription(payload.getDescription());
        }

        validate(service);
        return roomServiceRepository.update(service);
    }

    @Transactional
    public void delete(Long id) {
        RoomService service = requireService(id);
        if (roomServiceRepository.isServiceUsed(id)) {
            throw new IllegalArgumentException("Cannot delete room service that is used by rooms.");
        }
        roomServiceRepository.delete(service);
    }

    private void validate(RoomService service) {
        if (service.getName() == null || service.getName().isBlank()) {
            throw new IllegalArgumentException("Room service name is required");
        }
    }

    private RoomService requireService(Long id) {
        RoomService service = roomServiceRepository.findById(id);
        if (service == null) {
            throw new IllegalArgumentException("Room service not found");
        }
        return service;
    }
}
