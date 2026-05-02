package cz.fit.hotel.rest;

import cz.fit.hotel.business.RoomServiceManager;
import cz.fit.hotel.model.RoomService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.List;

@Path("/room-amenities") // Renamed to avoid confusion with ExtraService
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({"administrator", "RECEPTIONIST", "MANAGER"})
@Tag(name = "Room Amenities", description = "Management of room equipment (TV, AC, WiFi, etc.)")
public class RoomServiceResource {

    @Inject
    RoomServiceManager roomServiceManager;

    @GET
    @Operation(summary = "List all room amenities", description = "Retrieves all available room equipment items.")
    public List<RoomService> all() {
        return roomServiceManager.findAll();
    }

    @GET
    @Path("/{id}")
    @Operation(summary = "Get amenity by ID", description = "Retrieves details of a specific room equipment item.")
    public RoomService one(@PathParam("id") Long id) {
        return roomServiceManager.findById(id);
    }

    @POST
    @Operation(summary = "Create new amenity", description = "Adds a new equipment item to the system.")
    public RoomService create(RoomService service) {
        return roomServiceManager.create(service);
    }

    @PUT
    @Path("/{id}")
    @Operation(summary = "Update amenity", description = "Modifies an existing equipment item.")
    public RoomService update(@PathParam("id") Long id, RoomService service) {
        return roomServiceManager.update(id, service);
    }

    @DELETE
    @Path("/{id}")
    @Operation(summary = "Delete amenity", description = "Removes an equipment item if it's not assigned to any rooms.")
    public void delete(@PathParam("id") Long id) {
        roomServiceManager.delete(id);
    }
}
