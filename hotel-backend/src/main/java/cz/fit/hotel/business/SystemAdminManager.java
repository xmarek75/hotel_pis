package cz.fit.hotel.business;

import cz.fit.hotel.repository.*;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.LinkedHashMap;
import java.util.Map;

@ApplicationScoped
public class SystemAdminManager {

    @Inject
    RoomRepository roomRepository;

    @Inject
    ReservationRepository reservationRepository;

    @Inject
    CustomerRepository customerRepository;

    @Inject
    EmployeeRepository employeeRepository;

    public Map<String, Object> getSystemOverview() {
        // Jednoduchy dashboard endpoint. Nepouziva agregacni SQL, protoze objem demo dat je maly.
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("rooms", roomRepository.findAll().size());
        result.put("reservations", reservationRepository.findAll().size());
        result.put("customers", customerRepository.findAll().size());
        result.put("employees", employeeRepository.findAll().size());
        return result;
    }

    public Map<String, String> backupData() {
        
        Map<String, String> result = new LinkedHashMap<>();
        result.put("status", "OK");
        result.put("message", "Backup simulation endpoint - integrate real backup tooling here.");
        return result;
    }
}
