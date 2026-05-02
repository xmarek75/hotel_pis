package cz.fit.hotel.rest;

import cz.fit.hotel.business.RoomManager;
import cz.fit.hotel.model.Room;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.List;

@Path("/rooms")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({"administrator", "RECEPTIONIST"})
@Tag(name = "Rooms", description = "Management of hotel rooms, capacity, and inventory")
public class RoomResource {

    @Inject
    RoomManager roomManager;

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
    public Room create(Room room) {
        return roomManager.create(room);
    }

    @PUT
    @Path("/{id}")
    @Operation(summary = "Update room", description = "Updates room number, capacity, type, or price.")
    public Room update(@PathParam("id") Long id, Room room) {
        return roomManager.update(id, room);
    }

    @DELETE
    @Path("/{id}")
    @Operation(summary = "Deactivate room", description = "Removes the room from active inventory.")
    public void deactivate(@PathParam("id") Long id) {
        roomManager.deactivate(id);
    }
}
