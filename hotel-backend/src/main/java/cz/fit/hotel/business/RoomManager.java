package cz.fit.hotel.business;

import cz.fit.hotel.model.Room;
import cz.fit.hotel.repository.RoomRepository;
import cz.fit.hotel.repository.ReservationRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.List;
import java.time.LocalDate;

@ApplicationScoped
public class RoomManager {

    @Inject
    RoomRepository roomRepository;

    @Inject
    ReservationRepository reservationRepository;

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

        if (room.isActive() && !payload.isActive()) {
            validateNoUpcomingReservations(room);
        }
        room.setActive(payload.isActive());

        return roomRepository.update(room);
    }

    @Transactional
    public void deactivate(Long id) {
        Room room = requireRoom(id);
        validateNoUpcomingReservations(room);
        room.setActive(false);
        roomRepository.update(room);
    }

    private Room requireRoom(Long id) {
        Room room = roomRepository.findById(id);
        if (room == null) {
            throw new IllegalArgumentException("Room not found");
        }
        return room;
    }

    private void validateNoUpcomingReservations(Room room) {
        LocalDate today = LocalDate.now();

        boolean hasUpcoming = reservationRepository.hasUpcomingReservations(room.getId(), today);

        if (hasUpcoming) {
            throw new IllegalArgumentException("Room cannot be deactivated, it has upcoming reservations");
        }
    }
}
