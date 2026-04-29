package cz.fit.hotel.business;

import cz.fit.hotel.model.*;
import cz.fit.hotel.repository.*;
import cz.fit.hotel.security.PasswordHasher;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.context.Initialized;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@ApplicationScoped
public class DemoDataSeeder {

    @Inject
    RoomRepository roomRepository;

    @Inject
    EmployeeRepository employeeRepository;

    @Inject
    RoomTypeRepository roomTypeRepository;

    @Inject
    ExtraServiceRepository extraServiceRepository;

    @Inject
    RoomServiceRepository roomServiceRepository;

    @Inject
    CustomerRepository customerRepository;

    @Inject
    ReservationRepository reservationRepository;

    @Inject
    ReservationManager reservationManager;

    @Inject
    PaymentManager paymentManager;

    @Inject
    PasswordHasher passwordHasher;

    @Transactional
    void onStartup(@Observes @Initialized(ApplicationScoped.class) Object ignored) {
        // Seed je rozdeleny na maly "zaklad" a rozsahlejsi demo dataset.
        // Zaklad zajisti, ze aplikace jde rovnou po startu otestovat.
        seedIfEmpty();
        seedExtendedDemoData();
    }

    private void seedIfEmpty() {
        if (!reservationRepository.findAll().isEmpty()) {
            return;
        }

        RoomType standardType = new RoomType("STANDARD");
        roomTypeRepository.save(standardType);

        RoomType deluxeType = new RoomType("DELUXE");
        roomTypeRepository.save(deluxeType);

        RoomType familyType = new RoomType("FAMILY");
        roomTypeRepository.save(familyType);

        RoomType suiteType = new RoomType("SUITE");
        roomTypeRepository.save(suiteType);

        RoomService wifi = new RoomService("WiFi", "High speed internet");
        roomServiceRepository.save(wifi);

        RoomService airConditioning = new RoomService("Klimatizace", "Individually controlled air conditioning");
        roomServiceRepository.save(airConditioning);

        RoomService babyCot = new RoomService("Detska postylka", "Baby cot available in the room");
        roomServiceRepository.save(babyCot);

        RoomService tv = new RoomService("Televize", "Flat screen TV");
        roomServiceRepository.save(tv);

        Room r101 = new Room("101", 2, new BigDecimal("89.00"), standardType);
        r101.addService(wifi);
        r101.addService(tv);
        roomRepository.save(r101);

        Room r102 = new Room("102", 3, new BigDecimal("119.00"), deluxeType);
        r102.addService(wifi);
        r102.addService(airConditioning);
        r102.addService(tv);
        roomRepository.save(r102);

        Room r201 = new Room("201", 4, new BigDecimal("149.00"), familyType);
        r201.addService(wifi);
        r201.addService(airConditioning);
        r201.addService(babyCot);
        r201.addService(tv);
        roomRepository.save(r201);

        Employee e1 = new Employee("Recepce", "reception", "+420777111222", EmployeeRole.RECEPTIONIST);
        e1.setPassword(passwordHasher.hash("reception123"));
        employeeRepository.save(e1);

        Employee e2 = new Employee("Administrátor", "admin", "+420777333444", EmployeeRole.ADMINISTRATOR);
        e2.setPassword(passwordHasher.hash("admin123"));
        employeeRepository.save(e2);

        ExtraService breakfast = new ExtraService("Breakfast", new BigDecimal("12.00"), "Breakfast buffet");
        extraServiceRepository.save(breakfast);

        ExtraService parking = new ExtraService("Parking", new BigDecimal("8.00"), "Private guarded parking");
        extraServiceRepository.save(parking);

        ExtraService wellness = new ExtraService("Wellness", new BigDecimal("20.00"), "Sauna and wellness access");
        extraServiceRepository.save(wellness);

        Customer c1 = new Customer("Jan Kral", LocalDate.of(1990, 5, 12), "jan.kral@email.cz", "+420601111111");
        customerRepository.save(c1);

        Customer c2 = new Customer("Eva Dvorakova", LocalDate.of(1995, 9, 3), "eva.d@email.cz", "+420602222222");
        customerRepository.save(c2);

        Customer c3 = new Customer("Marek Urban", LocalDate.of(1979, 2, 19), "marek.urban@email.cz", "+421900123456");
        customerRepository.save(c3);

        LocalDate today = LocalDate.now();

        Reservation res1 = new Reservation();
        res1.setCheckInDate(today.plusDays(1));
        res1.setCheckOutDate(today.plusDays(4));
        res1.setNumberOfGuests(2);
        res1.setStatus(ReservationStatus.PENDING); // CONFIRMED moved/deleted
        res1.setSpecialRequests("High floor, quiet room");
        res1.setRoom(roomRepository.findByNumber("101"));
        res1.setCustomer(customerRepository.findById(c1.getId()));
        res1.setEmployee(employeeRepository.findById(e1.getId()));
        res1 = reservationManager.create(res1);

        Reservation res2 = new Reservation();
        res2.setCheckInDate(today.plusDays(3));
        res2.setCheckOutDate(today.plusDays(6));
        res2.setNumberOfGuests(3);
        res2.setStatus(ReservationStatus.PENDING);
        res2.setSpecialRequests("Late check-in");
        res2.setRoom(roomRepository.findByNumber("102"));
        res2.setCustomer(customerRepository.findById(c2.getId()));
        res2.setEmployee(employeeRepository.findById(e1.getId()));
        res2 = reservationManager.create(res2);

        Reservation res3 = new Reservation();
        res3.setCheckInDate(today.plusDays(7));
        res3.setCheckOutDate(today.plusDays(10));
        res3.setNumberOfGuests(4);
        res3.setStatus(ReservationStatus.PENDING); // CONFIRMED moved/deleted
        res3.setSpecialRequests("Baby crib needed");
        res3.setRoom(roomRepository.findByNumber("201"));
        res3.setCustomer(customerRepository.findById(c3.getId()));
        res3.setEmployee(employeeRepository.findById(e2.getId()));
        res3 = reservationManager.create(res3);

        Payment p1 = new Payment();
        p1.setAmount(new BigDecimal("100.00"));
        p1.setMethod(PaymentMethod.CARD); 
        p1.setEmployee(employeeRepository.findById(e1.getId()));
        p1.setReservation(reservationRepository.findById(res1.getId()));
        paymentManager.create(p1);

        Payment p2 = new Payment();
        p2.setAmount(new BigDecimal("60.00"));
        p2.setMethod(PaymentMethod.CASH);
        p2.setEmployee(employeeRepository.findById(e1.getId()));
        p2.setReservation(reservationRepository.findById(res2.getId()));
        paymentManager.create(p2);
    }

    private void seedExtendedDemoData() {
        // Rozsirena data drzi dashboard pouzitelny i pri filtrovani, strankovani a testech obsazenosti.
        seedAdditionalRooms();
        seedAdditionalCustomers();
        seedAdditionalReservations();
    }

    private void seedAdditionalRooms() {
        for (int i = 1; i <= 15; i++) {
            String roomNumber = String.valueOf(300 + i); // 301-315
            if (roomRepository.findByNumber(roomNumber) != null) {
                continue;
            }

            RoomType resolvedType = roomTypeRepository.findByName(i % 3 == 0 ? "SUITE" : (i % 2 == 0 ? "DELUXE" : "STANDARD"));
            if (resolvedType == null) {
               resolvedType = roomTypeRepository.findByName("STANDARD");
            }

            Room room = new Room();
            room.setNumber(roomNumber);
            room.setCapacity(1 + (i % 5)); // 2-5
            room.setType(resolvedType);
            room.setPricePerNight(new BigDecimal(85 + (i * 7)));
            
            roomRepository.save(room);
        }
    }

    private void seedAdditionalCustomers() {
        List<Customer> existingCustomers = customerRepository.findAll();
        Set<String> existingEmails = new HashSet<>();
        for (Customer customer : existingCustomers) {
            if (customer.getEmail() != null) {
                existingEmails.add(customer.getEmail().trim().toLowerCase());
            }
        }

        for (int i = 1; i <= 15; i++) {
            String email = String.format("demo.customer%02d@hotel.test", i);
            if (existingEmails.contains(email)) {
                continue;
            }

            Customer customer = new Customer(
                    String.format("Demo Zákazník %02d", i),
                    LocalDate.of(1980 + (i % 25), (i % 12) + 1, (i % 27) + 1),
                    email,
                    String.format("+420777%06d", 100000 + i)
            );
            customerRepository.save(customer);
            existingEmails.add(email);
        }
    }

    private void seedAdditionalReservations() {
        final String marker = "[DEMO-BULK-FEBMAR]";
        final int targetDemoReservations = 120;
        List<Reservation> existingReservations = reservationRepository.findAll();
        long existingDemoReservations = existingReservations.stream()
                .filter(r -> r.getSpecialRequests() != null && r.getSpecialRequests().startsWith(marker))
                .count();

        int toCreate = (int) Math.max(0, targetDemoReservations - existingDemoReservations);
        if (toCreate == 0) {
            return;
        }

        List<Room> rooms = roomRepository.findAll().stream()
                // Room logic no longer has isActive()
                .toList();
        List<Customer> customers = customerRepository.findAll();
        if (rooms.isEmpty() || customers.isEmpty()) {
            return;
        }

        Employee employee = null; 
        List<Employee> allEmployees = employeeRepository.findAll();
        if(!allEmployees.isEmpty()) {
            employee = allEmployees.get(0);
        }

        if (employee == null) {
            Employee fallback = employeeRepository.findByUsername("demo-reception");
            if (fallback == null) {
                fallback = new Employee("Demo Reception", "demo-reception", "+420777555666", EmployeeRole.RECEPTIONIST);
                fallback.setPassword(passwordHasher.hash("demo123"));
                employeeRepository.save(fallback);
            }
            employee = fallback;
        }

        int demoYear = resolveDemoYearForFebMar(LocalDate.now());
        LocalDate febStart = LocalDate.of(demoYear, 2, 1);
        LocalDate marEnd = LocalDate.of(demoYear, 3, 31);
        LocalDate today = LocalDate.now();
        String[] reservationTypes = new String[]{
                "Business trip",
                "Weekend getaway",
                "Family stay",
                "Wellness package",
                "Late check-in",
                "Early check-out",
                "City break",
                "Long stay",
                "Anniversary"
        };

        // Keep occupancy dense and regular across a subset of rooms.
        int roomsToUse = Math.min(10, rooms.size());
        int created = 0;
        int sequence = 0;

        for (int roomIndex = 0; roomIndex < roomsToUse && created < toCreate; roomIndex++) {
            Room room = rooms.get(roomIndex);
            LocalDate cursor = febStart.plusDays(roomIndex % 3); // slight phase shift per room

            while (!cursor.isAfter(marEnd.minusDays(1)) && created < toCreate) {
                int stayNights = 2 + (sequence % 3); // 2-4 nights
                LocalDate checkIn = cursor;
                LocalDate checkOut = checkIn.plusDays(stayNights);
                if (checkOut.isAfter(marEnd.plusDays(1))) {
                    break;
                }

                // Replacing deleted `findUnavailableRoomsCount` from RoomRepository:
                // For demo purposes, we will assume it's available or we just try to create it and catch the exception 
                // However, since we are iterating chronologically with short gaps, we will assume they don't overlap on purpose.
                long unavailableCount = 0; 
                
                if (unavailableCount == 0) {
                    Customer customer = customers.get((sequence * 5) % customers.size());
                    Reservation reservation = new Reservation();
                    reservation.setCheckInDate(checkIn);
                    reservation.setCheckOutDate(checkOut);
                    reservation.setNumberOfGuests(Math.min(room.getCapacity(), 1 + (sequence % Math.max(room.getCapacity(), 1))));
                    reservation.setStatus(pickDemoStatus(checkIn, checkOut, today, sequence));
                    reservation.setSpecialRequests(marker
                            + " Type: " + reservationTypes[sequence % reservationTypes.length]
                            + " | Reservation #" + (existingDemoReservations + created + 1));
                    reservation.setRoom(room);
                    reservation.setCustomer(customer);
                    reservation.setEmployee(employee);
                    reservationManager.create(reservation);
                    created++;
                }

                // Short gap keeps occupancy relatively high and regular.
                cursor = checkOut.plusDays(roomIndex % 2);
                sequence++;
            }
        }
    }

    private int resolveDemoYearForFebMar(LocalDate today) {
        // If today is after March, seed next year's February/March to keep demo data useful.
        return today.getMonthValue() > 3 ? today.getYear() + 1 : today.getYear();
    }

    private ReservationStatus pickDemoStatus(LocalDate checkIn, LocalDate checkOut, LocalDate today, int sequence) {
        if (checkOut.isBefore(today)) {
            return sequence % 7 == 0 ? ReservationStatus.CANCELED : ReservationStatus.CHECKED_OUT;
        }
        if ((checkIn.isBefore(today) || checkIn.isEqual(today)) && checkOut.isAfter(today)) {
            return ReservationStatus.CHECKED_IN;
        }
        return ReservationStatus.PENDING; 
    }
}
