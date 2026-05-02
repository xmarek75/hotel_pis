package cz.fit.hotel.rest;

import cz.fit.hotel.business.RoomTypeManager;
import cz.fit.hotel.model.RoomType;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.List;

@Path("/room-types")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({"administrator", "RECEPTIONIST", "MANAGER"})
@Tag(name = "Room Types", description = "Management of room categories (e.g., Single, Double, Suite)")
public class RoomTypeResource {

    @Inject
    RoomTypeManager roomTypeManager;

    @GET
    @Operation(summary = "List all room types", description = "Retrieves all available room categories.")
    public List<RoomType> all() {
        return roomTypeManager.findAll();
    }

    @GET
    @Path("/{id}")
    @Operation(summary = "Get room type by ID", description = "Retrieves details of a specific room category.")
    public RoomType one(@PathParam("id") Long id) {
        return roomTypeManager.findById(id);
    }

    @POST
    @Operation(summary = "Create new room type", description = "Adds a new room category to the system.")
    public RoomType create(RoomType type) {
        return roomTypeManager.create(type);
    }

    @PUT
    @Path("/{id}")
    @Operation(summary = "Update room type", description = "Modifies an existing room category name.")
    public RoomType update(@PathParam("id") Long id, RoomType type) {
        return roomTypeManager.update(id, type);
    }

    @DELETE
    @Path("/{id}")
    @Operation(summary = "Delete room type", description = "Removes a room category if it's not assigned to any rooms.")
    public void delete(@PathParam("id") Long id) {
        roomTypeManager.delete(id);
    }
}
