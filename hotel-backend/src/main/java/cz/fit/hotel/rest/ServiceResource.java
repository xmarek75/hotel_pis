package cz.fit.hotel.rest;

import cz.fit.hotel.business.ExtraServiceManager;
import cz.fit.hotel.model.ExtraService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.List;

@Path("/services")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({"administrator", "RECEPTIONIST", "MANAGER"})
@Tag(name = "Extra Services", description = "Management of additional hotel services (Breakfast, Parking, etc.)")
public class ServiceResource {

    @Inject
    ExtraServiceManager serviceManager;

    @GET
    @Operation(summary = "List all services", description = "Retrieves the full catalog of available extra services.")
    public List<ExtraService> all() {
        return serviceManager.findAll();
    }

    @GET
    @Path("/{id}")
    @Operation(summary = "Get service by ID", description = "Retrieves details of a specific extra service.")
    public ExtraService one(@PathParam("id") Long id) {
        return serviceManager.findById(id);
    }

    @POST
    @Operation(summary = "Add new service", description = "Creates a new service in the catalog.")
    public ExtraService create(ExtraService service) {
        return serviceManager.create(service);
    }

    @PUT
    @Path("/{id}")
    @Operation(summary = "Update service", description = "Modifies an existing service's name, price, or description.")
    public ExtraService update(@PathParam("id") Long id, ExtraService service) {
        return serviceManager.update(id, service);
    }

    @DELETE
    @Path("/{id}")
    @Operation(summary = "Remove service", description = "Deletes a service from the catalog.")
    public void delete(@PathParam("id") Long id) {
        serviceManager.delete(id);
    }
}
