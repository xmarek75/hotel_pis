package cz.fit.hotel.rest;

import cz.fit.hotel.business.CustomerManager;
import cz.fit.hotel.model.Customer;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.List;

@Path("/customers")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({ "administrator", "RECEPTIONIST", "MANAGER" })
@Tag(name = "Customers", description = "Management of hotel guests (CRUD)")
public class CustomerResource {

    @Inject
    CustomerManager customerManager;

    @GET
    @Operation(summary = "Get all customers", description = "Returns a list of all guests registered in the system.")
    public List<Customer> all() {
        return customerManager.findAll();
    }

    @GET
    @Path("/{id}")
    @Operation(summary = "Get customer by ID", description = "Retrieves details of a specific guest using their unique ID.")
    public Customer one(@PathParam("id") Long id) {
        return customerManager.findById(id);
    }

    @POST
    @Operation(summary = "Create a new customer", description = "Registers a new guest. Validates unique phone number and format.")
    public Customer create(Customer customer) {
        return customerManager.create(customer);
    }

    @PUT
    @Path("/{id}")
    @Operation(summary = "Update customer", description = "Updates an existing guest's information. Validates data formats and unique phone.")
    public Customer update(@PathParam("id") Long id, Customer customer) {
        return customerManager.update(id, customer);
    }

    @DELETE
    @Path("/{id}")
    @Operation(summary = "Delete customer", description = "Removes a guest from the system. Fails if the guest has active reservations.")
    public void delete(@PathParam("id") Long id) {
        customerManager.delete(id);
    }
}
