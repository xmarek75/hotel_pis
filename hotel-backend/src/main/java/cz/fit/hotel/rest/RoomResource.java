package cz.fit.hotel.rest;

import cz.fit.hotel.business.RoomManager;
import cz.fit.hotel.model.Room;
import cz.fit.hotel.model.RoomService;
import cz.fit.hotel.model.RoomType;
import cz.fit.hotel.repository.RoomServiceRepository;
import cz.fit.hotel.repository.RoomTypeRepository;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Path("/rooms")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({ "administrator", "RECEPTIONIST", "MANAGER" })
@Tag(name = "Rooms", description = "Management of hotel rooms, capacity, and inventory")
public class RoomResource {

    @Inject
    RoomManager roomManager;

    @Inject
    RoomTypeRepository roomTypeRepository;

    @Inject
    RoomServiceRepository roomServiceRepository;

    @GET
    @Operation(summary = "List all rooms", description = "Retrieves a list of all hotel rooms and their details.")
    public List<Room> all() {
        return roomManager.findAll();
    }

    @GET
    @Path("/{id}")
    @Operation(summary = "Get room by ID", description = "Retrieves information about a specific room.")
    public Room one(@PathParam("id") Long id) {
        return roomManager.findById(id);
    }

    @POST
    @Operation(summary = "Create new room", description = "Adds a new room to the inventory. Validates unique room number.")
    @Transactional
    public Room create(RoomRequest request) {
        Room room = toRoom(request);
        Room created = roomManager.create(room);
        if (request != null && request.roomServiceIds != null) {
            syncRoomServices(created, request.roomServiceIds);
        }
        return created;
    }

    @PUT
    @Path("/{id}")
    @Operation(summary = "Update room", description = "Updates room number, capacity, type, or price.")
    @Transactional
    public Room update(@PathParam("id") Long id, RoomRequest request) {
        Room room = toRoom(request);
        Room updated = roomManager.update(id, room);
        if (request != null && request.roomServiceIds != null) {
            syncRoomServices(updated, request.roomServiceIds);
        }
        return updated;
    }

    @DELETE
    @Path("/{id}")
    @Operation(summary = "Deactivate room", description = "Removes the room from active inventory.")
    public void deactivate(@PathParam("id") Long id) {
        roomManager.deactivate(id);
    }

    private Room toRoom(RoomRequest request) {
        if (request == null) {
            throw new BadRequestException("Room payload is required");
        }

        Room room = new Room();
        room.setNumber(request.number);
        room.setCapacity(request.capacity);
        room.setPricePerNight(request.pricePerNight == null ? BigDecimal.ZERO : request.pricePerNight);
        room.setType(resolveRoomType(request));
        if (request.active != null) room.setActive(request.active);
        return room;
    }

    private RoomType resolveRoomType(RoomRequest request) {
        if (request == null) {
            return null;
        }
        if (request.typeId != null) {
            RoomType type = roomTypeRepository.findById(request.typeId);
            if (type == null) {
                throw new BadRequestException("Room type not found: " + request.typeId);
            }
            return type;
        }
        if (request.typeName != null && !request.typeName.isBlank()) {
            RoomType type = roomTypeRepository.findByName(request.typeName.trim());
            if (type == null) {
                throw new BadRequestException("Room type not found: " + request.typeName);
            }
            return type;
        }
        return null;
    }

    private void syncRoomServices(Room room, List<Long> roomServiceIds) {
        Set<RoomService> services = new LinkedHashSet<>();
        for (Long serviceId : roomServiceIds) {
            if (serviceId == null) {
                continue;
            }
            RoomService service = roomServiceRepository.findById(serviceId);
            if (service == null) {
                throw new BadRequestException("Room service not found: " + serviceId);
            }
            services.add(service);
        }

        room.getServices().clear();
        room.getServices().addAll(services);
    }

    public static class RoomRequest {
        public String number;
        public Long typeId;
        public String typeName;
        public Integer capacity;
        public BigDecimal pricePerNight;
        public List<Long> roomServiceIds;
        public Boolean active;
    }
}
