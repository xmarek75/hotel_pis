package cz.fit.hotel.rest;

import cz.fit.hotel.business.SystemAdminManager;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.Map;

@Path("/sysadmin")
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({"administrator"})
public class SystemAdminResource {

    @Inject
    SystemAdminManager systemAdminManager;

    @GET
    @Path("/overview")
    public Map<String, Object> overview() {
        return systemAdminManager.getSystemOverview();
    }

    @POST
    @Path("/backup")
    public Map<String, String> backup() {
        return systemAdminManager.backupData();
    }
}
