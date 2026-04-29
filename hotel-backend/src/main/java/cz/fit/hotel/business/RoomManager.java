package cz.fit.hotel.business;

import cz.fit.hotel.model.Room;
import cz.fit.hotel.model.RoomService;
import cz.fit.hotel.repository.RoomRepository;
import cz.fit.hotel.repository.RoomServiceRepository;
import cz.fit.hotel.repository.RoomTypeRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.List;

@ApplicationScoped
public class RoomManager {

    @Inject
    RoomRepository roomRepository;

    @Inject
    RoomTypeRepository roomTypeRepository;

    @Inject
    RoomServiceRepository roomServiceRepository;

    public List<Room> findAll() {
        return roomRepository.findAll();
    }

    public Room findById(Long id) {
        return roomRepository.findById(id);
    }

    @Transactional
    public Room create(Room room) {
        // Pokoj smi vzniknout jen s unikatnim cislem a minimalni sadou provoznich dat.
        if (room.getNumber() == null || room.getNumber().isBlank()) {
            throw new IllegalArgumentException("Room number is required");
        }
        if (room.getCapacity() == null || room.getCapacity() <= 0) {
            throw new IllegalArgumentException("Capacity must be greater than 0");
        }
        if (roomRepository.findByNumber(room.getNumber()) != null) {
            throw new IllegalArgumentException("Room number already exists");
        }
        room.setType(resolveRoomType(room));
        replaceServicesWithManagedEntities(room, room.getServices());

        if (room.getPricePerNight() == null) {
            room.setPricePerNight(java.math.BigDecimal.ZERO);
        }

        roomRepository.save(room);
        return room;
    }

    @Transactional
    public Room update(Long id, Room payload) {
        Room room = requireRoom(id);

        if (payload.getNumber() != null && !payload.getNumber().isBlank()) {
            Room sameNumber = roomRepository.findByNumber(payload.getNumber());
            if (sameNumber != null && !sameNumber.getId().equals(id)) {
                throw new IllegalArgumentException("Room number already exists");
            }
            room.setNumber(payload.getNumber());
        }

        if (payload.getCapacity() != null && payload.getCapacity() > 0) {
            room.setCapacity(payload.getCapacity());
        }

        if (payload.getType() != null) {
            room.setType(resolveRoomType(payload));
        }

        if (payload.getPricePerNight() != null) {
            room.setPricePerNight(payload.getPricePerNight());
        }
        if (payload.getServices() != null) {
            replaceServicesWithManagedEntities(room, payload.getServices());
        }

        return roomRepository.update(room);
    }

    @Transactional
    public void deactivate(Long id) {
        Room room = requireRoom(id);
        // Room entity doesn't have setActive anymore, needs another way to handle deactivation or ignore.
        // Assuming we throw an exception or handle it differently based on new model.
        throw new UnsupportedOperationException("Room deactivation not supported in the new model");
    }

    private Room requireRoom(Long id) {
        Room room = roomRepository.findById(id);
        if (room == null) {
            throw new IllegalArgumentException("Room not found");
        }
        return room;
    }

    private cz.fit.hotel.model.RoomType resolveRoomType(Room room) {
        if (room.getType() == null) {
            throw new IllegalArgumentException("Room type is required");
        }
        if (room.getType().getId() != null) {
            cz.fit.hotel.model.RoomType type = roomTypeRepository.findById(room.getType().getId());
            if (type != null) {
                return type;
            }
        }
        String name = room.getType().getName();
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Room type is required");
        }
        cz.fit.hotel.model.RoomType type = roomTypeRepository.findByName(name.trim());
        if (type == null) {
            throw new IllegalArgumentException("Room type not found");
        }
        return type;
    }

    private void replaceServicesWithManagedEntities(Room room, java.util.Set<RoomService> requestedServices) {
        java.util.Set<RoomService> requestedCopy = requestedServices == null
                ? java.util.Set.of()
                : new java.util.LinkedHashSet<>(requestedServices);
        java.util.Set<RoomService> currentServices = new java.util.LinkedHashSet<>(room.getServices());
        for (RoomService existingService : currentServices) {
            room.removeService(existingService);
        }
        if (requestedCopy.isEmpty()) {
            return;
        }
        for (RoomService requestedService : requestedCopy) {
            RoomService service = resolveRoomService(requestedService);
            room.addService(service);
        }
    }

    private RoomService resolveRoomService(RoomService requestedService) {
        if (requestedService == null) {
            throw new IllegalArgumentException("Room service is required");
        }
        if (requestedService.getId() != null) {
            RoomService service = roomServiceRepository.findById(requestedService.getId());
            if (service != null) {
                return service;
            }
        }
        String name = requestedService.getName();
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Room service is required");
        }
        RoomService service = roomServiceRepository.findByName(name.trim());
        if (service == null) {
            throw new IllegalArgumentException("Room service not found");
        }
        return service;
    }
}
