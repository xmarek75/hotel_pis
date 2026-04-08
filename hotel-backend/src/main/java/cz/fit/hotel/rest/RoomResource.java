package cz.fit.hotel.rest;

import cz.fit.hotel.business.RoomManager;
import cz.fit.hotel.model.Room;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/rooms")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({"administrator", "RECEPTIONIST"})
public class RoomResource {

    @Inject
    RoomManager roomManager;

    @GET
    public List<Room> all() {
        return roomManager.findAll();
    }

    @GET
    @Path("/{id}")
    public Room one(@PathParam("id") Long id) {
        return roomManager.findById(id);
    }

    @POST
    public Room create(Room room) {
        return roomManager.create(room);
    }

    @PUT
    @Path("/{id}")
    public Room update(@PathParam("id") Long id, Room room) {
        return roomManager.update(id, room);
    }

    @DELETE
    @Path("/{id}")
    public void deactivate(@PathParam("id") Long id) {
        roomManager.deactivate(id);
    }
}
