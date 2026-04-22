package cz.fit.hotel.rest;

import cz.fit.hotel.business.ServiceManager;
import cz.fit.hotel.model.Service;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/services")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class ServiceResource {

    @Inject
    ServiceManager serviceManager;

    @GET
    @RolesAllowed({"administrator", "RECEPTIONIST", "MANAGER"})
    public List<Service> all() {
        return serviceManager.findAll();
    }

    @GET
    @Path("/{id}")
    @RolesAllowed({"administrator", "RECEPTIONIST", "MANAGER"})
    public Service one(@PathParam("id") Long id) {
        return serviceManager.findById(id);
    }

    @POST
    @RolesAllowed({"administrator", "MANAGER"})
    public Service create(Service service) {
        try {
            return serviceManager.create(service);
        } catch (IllegalArgumentException ex) {
            throw badRequest(ex);
        }
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed({"administrator", "MANAGER"})
    public Service update(@PathParam("id") Long id, Service service) {
        try {
            return serviceManager.update(id, service);
        } catch (IllegalArgumentException ex) {
            throw badRequest(ex);
        }
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed({"administrator", "MANAGER"})
    public void delete(@PathParam("id") Long id) {
        try {
            serviceManager.delete(id);
        } catch (IllegalArgumentException ex) {
            throw badRequest(ex);
        }
    }

    private BadRequestException badRequest(IllegalArgumentException ex) {
        return new BadRequestException(ex.getMessage());
    }
}
