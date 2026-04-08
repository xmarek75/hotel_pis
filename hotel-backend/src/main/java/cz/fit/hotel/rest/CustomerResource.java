package cz.fit.hotel.rest;

import cz.fit.hotel.business.CustomerManager;
import cz.fit.hotel.model.Customer;
import cz.fit.hotel.model.CustomerDetails;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/customers")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({"administrator", "RECEPTIONIST"})
public class CustomerResource {

    @Inject
    CustomerManager customerManager;

    @GET
    public List<Customer> all() {
        return customerManager.findAll();
    }

    @GET
    @Path("/{id}")
    public Customer one(@PathParam("id") Long id) {
        return customerManager.findById(id);
    }

    @GET
    @Path("/{id}/details")
    public CustomerDetails details(@PathParam("id") Long id) {
        return customerManager.getDetails(id);
    }

    @POST
    public Customer create(Customer customer) {
        return customerManager.create(customer);
    }

    @PUT
    @Path("/{id}")
    public Customer update(@PathParam("id") Long id, Customer customer) {
        return customerManager.update(id, customer);
    }

    @DELETE
    @Path("/{id}")
    public void delete(@PathParam("id") Long id) {
        customerManager.delete(id);
    }
}
