package cz.fit.hotel.rest;

import cz.fit.hotel.business.RoomServiceManager;
import cz.fit.hotel.model.RoomService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/room-services")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class RoomServiceResource {

    @Inject
    RoomServiceManager roomServiceManager;

    @GET
    @RolesAllowed({"administrator", "RECEPTIONIST", "MANAGER"})
    public List<RoomService> all() {
        return roomServiceManager.findAll();
    }

    @GET
    @Path("/{id}")
    @RolesAllowed({"administrator", "RECEPTIONIST", "MANAGER"})
    public RoomService one(@PathParam("id") Long id) {
        return roomServiceManager.findById(id);
    }

    @POST
    @RolesAllowed({"administrator"})
    public RoomService create(RoomService service) {
        return roomServiceManager.create(service);
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed({"administrator"})
    public RoomService update(@PathParam("id") Long id, RoomService service) {
        return roomServiceManager.update(id, service);
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed({"administrator"})
    public void delete(@PathParam("id") Long id) {
        roomServiceManager.delete(id);
    }
}
