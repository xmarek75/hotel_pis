package cz.fit.hotel.repository;

import cz.fit.hotel.model.EmployeeRole;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Arrays;
import java.util.List;

@ApplicationScoped
public class RoleRepository {

    public List<EmployeeRole> findAllRoles() {
        return Arrays.asList(EmployeeRole.values());
    }
}
