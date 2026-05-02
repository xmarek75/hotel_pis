package cz.fit.hotel.rest;

import cz.fit.hotel.business.ExtraServiceManager;
import cz.fit.hotel.model.ExtraService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/services")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({"administrator", "RECEPTIONIST", "MANAGER"})
public class ServiceResource {

    @Inject
    ExtraServiceManager serviceManager;

    @GET
    public List<ExtraService> all() {
        return serviceManager.findAll();
    }

    @GET
    @Path("/{id}")
    public ExtraService one(@PathParam("id") Long id) {
        return serviceManager.findById(id);
    }

    @POST
    public ExtraService create(ExtraService service) {
        return serviceManager.create(service);
    }

    @PUT
    @Path("/{id}")
    public ExtraService update(@PathParam("id") Long id, ExtraService service) {
        return serviceManager.update(id, service);
    }

    @DELETE
    @Path("/{id}")
    public void delete(@PathParam("id") Long id) {
        serviceManager.delete(id);
    }
}
