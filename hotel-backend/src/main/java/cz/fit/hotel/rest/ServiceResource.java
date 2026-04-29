package cz.fit.hotel.rest;

import cz.fit.hotel.business.ExtraServiceManager;
import cz.fit.hotel.model.ExtraService;
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

@Path("/services")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class ServiceResource {

    @Inject
    ExtraServiceManager extraServiceManager;

    @GET
    @RolesAllowed({"administrator", "RECEPTIONIST", "MANAGER"})
    public List<ExtraService> all() {
        return extraServiceManager.findAll();
    }

    @GET
    @Path("/{id}")
    @RolesAllowed({"administrator", "RECEPTIONIST", "MANAGER"})
    public ExtraService one(@PathParam("id") Long id) {
        return extraServiceManager.findById(id);
    }

    @POST
    @RolesAllowed({"administrator"})
    public ExtraService create(ExtraService service) {
        return extraServiceManager.create(service);
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed({"administrator"})
    public ExtraService update(@PathParam("id") Long id, ExtraService service) {
        return extraServiceManager.update(id, service);
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed({"administrator"})
    public void delete(@PathParam("id") Long id) {
        extraServiceManager.delete(id);
    }
}
