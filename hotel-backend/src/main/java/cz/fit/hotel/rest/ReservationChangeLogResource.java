package cz.fit.hotel.rest;

import cz.fit.hotel.business.ReservationChangeLogManager;
import cz.fit.hotel.model.ReservationChangeLog;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.List;

@Path("/audit-logs")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({"administrator"}) // Restricted: only admin can see audit history
@Tag(name = "Audit Logs", description = "History of changes made to entities for tracking and security purposes")
public class ReservationChangeLogResource {

    @Inject
    ReservationChangeLogManager logManager;

    @GET
    @Path("/reservations")
    @Operation(summary = "List all reservation logs", description = "Retrieves a complete history of all changes made to any reservation.")
    public List<ReservationChangeLog> all() {
        return logManager.getAllHistory();
    }

    @GET
    @Path("/reservations/{id}")
    @Operation(summary = "Get reservation history", description = "Retrieves a detailed list of all changes made to a specific reservation.")
    public List<ReservationChangeLog> getReservationHistory(@PathParam("id") Long id) {
        return logManager.getHistory(id);
    }
}
