package cz.fit.hotel.business;

import cz.fit.hotel.model.Room;
import cz.fit.hotel.repository.RoomRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.List;

@ApplicationScoped
public class RoomManager {

    @Inject
    RoomRepository roomRepository;

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
            room.setType(payload.getType());
        }

        if (payload.getPricePerNight() != null) {
            room.setPricePerNight(payload.getPricePerNight());
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
}
