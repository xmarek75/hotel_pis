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
        validate(service, null);
        roomServiceRepository.save(service);
        return service;
    }

    @Transactional
    public RoomService update(Long id, RoomService payload) {
        RoomService service = requireService(id);
        validate(payload, id);

        service.setName(payload.getName().trim());
        service.setDescription(payload.getDescription() != null ? payload.getDescription().trim() : null);
        return roomServiceRepository.update(service);
    }

    @Transactional
    public void delete(Long id) {
        roomServiceRepository.delete(requireService(id));
    }

    private RoomService requireService(Long id) {
        RoomService service = roomServiceRepository.findById(id);
        if (service == null) {
            throw new IllegalArgumentException("Room service not found");
        }
        return service;
    }

    private void validate(RoomService service, Long currentId) {
        if (service == null) {
            throw new IllegalArgumentException("Room service payload is required");
        }
        if (service.getName() == null || service.getName().isBlank()) {
            throw new IllegalArgumentException("Room service name is required");
        }
        RoomService sameName = roomServiceRepository.findByName(service.getName().trim());
        if (sameName != null && (currentId == null || !sameName.getId().equals(currentId))) {
            throw new IllegalArgumentException("Room service with this name already exists");
        }

        service.setName(service.getName().trim());
        if (service.getDescription() != null) {
            service.setDescription(service.getDescription().trim());
        }
    }
}
