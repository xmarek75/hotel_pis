package cz.fit.hotel.rest;

import cz.fit.hotel.business.EmployeeManager;
import cz.fit.hotel.model.Employee;
import cz.fit.hotel.model.EmployeeRole;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/employees")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({"administrator"})
public class EmployeeResource {

    @Inject
    EmployeeManager employeeManager;

    @GET
    public List<Employee> all() {
        return employeeManager.findAll();
    }

    @GET
    @Path("/{id}")
    public Employee one(@PathParam("id") Long id) {
        return employeeManager.findById(id);
    }

    @POST
    public Employee create(EmployeeUpsertRequest request) {
        Employee employee = toEmployee(request, false);
        return employeeManager.create(employee);
    }

    @PUT
    @Path("/{id}")
    public Employee update(@PathParam("id") Long id, EmployeeUpsertRequest request) {
        Employee employee = toEmployee(request, true);
        return employeeManager.update(id, employee);
    }

    @DELETE
    @Path("/{id}")
    public void deactivate(@PathParam("id") Long id) {
        employeeManager.delete(id);
    }

    private Employee toEmployee(EmployeeUpsertRequest request, boolean updateMode) {
        if (request == null) {
            throw new BadRequestException("Missing employee payload");
        }
        Employee employee = new Employee();
        employee.setName(request.name);
        employee.setUsername(request.username);
        employee.setContact(request.contact);
        if (request.role != null && !request.role.isBlank()) {
            try {
                employee.setRole(EmployeeRole.valueOf(request.role.trim()));
            } catch (IllegalArgumentException ex) {
                throw new BadRequestException("Invalid employee role");
            }
        }
        if (!updateMode || (request.password != null && !request.password.isBlank())) {
            employee.setPassword(request.password);
        }
        return employee;
    }

    public static class EmployeeUpsertRequest {
        public String name;
        public String username;
        public String contact;
        public String role;
        public String password;
    }
}
