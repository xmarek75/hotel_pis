package cz.fit.hotel.business;

import cz.fit.hotel.model.RoomType;
import cz.fit.hotel.repository.RoomTypeRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.List;

@ApplicationScoped
public class RoomTypeManager {

    @Inject
    RoomTypeRepository roomTypeRepository;

    public List<RoomType> findAll() {
        return roomTypeRepository.findAll();
    }

    public RoomType findById(Long id) {
        return roomTypeRepository.findById(id);
    }

    @Transactional
    public RoomType create(RoomType type) {
        validate(type);
        if (roomTypeRepository.findByName(type.getName()) != null) {
            throw new IllegalArgumentException("Room type with this name already exists");
        }
        roomTypeRepository.save(type);
        return type;
    }

    @Transactional
    public RoomType update(Long id, RoomType payload) {
        RoomType type = requireType(id);
        
        if (payload.getName() != null && !payload.getName().isBlank()) {
            RoomType existing = roomTypeRepository.findByName(payload.getName());
            if (existing != null && !existing.getId().equals(id)) {
                throw new IllegalArgumentException("Room type with this name already exists");
            }
            type.setName(payload.getName());
        }

        validate(type);
        return roomTypeRepository.update(type);
    }

    @Transactional
    public void delete(Long id) {
        RoomType type = requireType(id);
        if (roomTypeRepository.isTypeUsed(id)) {
            throw new IllegalArgumentException("Cannot delete room type that is used by rooms.");
        }
        roomTypeRepository.delete(type);
    }

    private void validate(RoomType type) {
        if (type.getName() == null || type.getName().isBlank()) {
            throw new IllegalArgumentException("Room type name is required");
        }
    }

    private RoomType requireType(Long id) {
        RoomType type = roomTypeRepository.findById(id);
        if (type == null) {
            throw new IllegalArgumentException("Room type not found");
        }
        return type;
    }
}
