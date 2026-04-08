package cz.fit.hotel.business;

import cz.fit.hotel.model.*;
import cz.fit.hotel.repository.*;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@ApplicationScoped
public class ReservationManager {

    @Inject
    ReservationRepository reservationRepository;

    @Inject
    RoomRepository roomRepository;

    @Inject
    CustomerRepository customerRepository;

    @Inject
    EmployeeRepository employeeRepository;

    @Inject
    PaymentRepository paymentRepository;

    @Inject
    ServiceRepository serviceRepository;

    public List<Reservation> findAll() {
        return reservationRepository.findAll();
    }

    public Reservation findById(Long id) {
        return reservationRepository.findById(id);
    }

    @Transactional
    public Reservation create(Reservation reservation) {
        validateDates(reservation);

        Long roomId = reservation.getRoom() != null ? reservation.getRoom().getId() : reservation.getRoomId();
        Long customerId = reservation.getCustomer() != null ? reservation.getCustomer().getId() : reservation.getCustomerId();
        Long employeeId = reservation.getEmployee() != null ? reservation.getEmployee().getId() : reservation.getEmployeeId();

        if (roomId == null) {
            throw new IllegalArgumentException("Room is required");
        }
        if (customerId == null) {
            throw new IllegalArgumentException("Customer is required");
        }
        if (reservation.getNumberOfGuests() == null || reservation.getNumberOfGuests() <= 0) {
            throw new IllegalArgumentException("Number of guests must be greater than 0");
        }

        Room room = roomRepository.findById(roomId);
        if (room == null || !room.isActive()) {
            throw new IllegalArgumentException("Room not found or inactive");
        }
        if (!room.isAvailableForGuests(reservation.getNumberOfGuests())) {
            throw new IllegalArgumentException("Number of guests exceeds room capacity");
        }

        if (roomRepository.findUnavailableRoomsCount(room.getId(), reservation.getCheckInDate(), reservation.getCheckOutDate()) > 0) {
            throw new IllegalArgumentException("Room is already reserved in the selected date range");
        }

        Customer customer = customerRepository.findById(customerId);
        if (customer == null) {
            throw new IllegalArgumentException("Customer not found");
        }

        Employee employee;
        if (employeeId != null) {
            employee = employeeRepository.findById(employeeId);
        } else {
            employee = employeeRepository.findFirstActive();
        }
        if (employee == null || !employee.isActive()) {
            throw new IllegalArgumentException("Employee not found or inactive");
        }

        reservation.assignRoom(room);
        reservation.setCustomer(customer);
        reservation.setEmployee(employee);
        applyServiceItems(reservation, reservation.getServiceItems());
        if (reservation.getStatus() == null) {
            reservation.setStatus(ReservationStatus.PENDING);
        }
        if (reservation.getCreatedAt() == null) {
            reservation.setCreatedAt(LocalDateTime.now());
        }

        reservation.setTotalPrice(reservation.calculateTotalPrice());
        reservation.setPaymentStatus(PaymentStatus.UNPAID);

        reservationRepository.save(reservation);
        return reservation;
    }

    @Transactional
    public Reservation updateStatus(Long id, ReservationStatus status) {
        Reservation reservation = reservationRepository.findById(id);
        if (reservation == null) {
            throw new IllegalArgumentException("Reservation not found");
        }
        reservation.updateReservationStatus(status);
        return reservationRepository.update(reservation);
    }

    @Transactional
    public Reservation update(Long id, Reservation payload) {
        Reservation reservation = reservationRepository.findById(id);
        if (reservation == null) {
            throw new IllegalArgumentException("Reservation not found");
        }

        boolean paymentStatusProvided = payload.getPaymentStatus() != null;

        if (payload.getCheckInDate() != null) {
            reservation.setCheckInDate(payload.getCheckInDate());
        }
        if (payload.getCheckOutDate() != null) {
            reservation.setCheckOutDate(payload.getCheckOutDate());
        }
        if (payload.getNumberOfGuests() != null) {
            reservation.setNumberOfGuests(payload.getNumberOfGuests());
        }
        if (payload.getSpecialRequests() != null) {
            reservation.setSpecialRequests(payload.getSpecialRequests());
        }
        if (payload.getStatus() != null) {
            reservation.setStatus(payload.getStatus());
        }
        if (paymentStatusProvided) {
            reservation.setPaymentStatus(payload.getPaymentStatus());
        }
        if (payload.getServiceItems() != null) {
            applyServiceItems(reservation, payload.getServiceItems());
        }

        validateDates(reservation);

        Room room = reservation.getRoom();
        if (room == null || !room.isActive()) {
            throw new IllegalArgumentException("Room not found or inactive");
        }
        if (reservation.getNumberOfGuests() == null || reservation.getNumberOfGuests() <= 0) {
            throw new IllegalArgumentException("Number of guests must be greater than 0");
        }
        if (!room.isAvailableForGuests(reservation.getNumberOfGuests())) {
            throw new IllegalArgumentException("Number of guests exceeds room capacity");
        }

        if (reservationRepository.hasRoomOverlapExcludingReservation(
                room.getId(), reservation.getCheckInDate(), reservation.getCheckOutDate(), reservation.getId()
        )) {
            throw new IllegalArgumentException("Room is already reserved in the selected date range");
        }

        reservation.setTotalPrice(reservation.calculateTotalPrice());
        Reservation updated = reservationRepository.update(reservation);
        if (paymentStatusProvided) {
            return updated;
        }
        return refreshPaymentStatus(id);
    }

    @Transactional
    public Reservation refreshPaymentStatus(Long id) {
        Reservation reservation = reservationRepository.findById(id);
        if (reservation == null) {
            throw new IllegalArgumentException("Reservation not found");
        }

        BigDecimal paid = paymentRepository.sumByReservationId(id);
        BigDecimal total = reservation.getTotalPrice() == null ? BigDecimal.ZERO : reservation.getTotalPrice();

        if (paid.compareTo(BigDecimal.ZERO) <= 0) {
            reservation.setPaymentStatus(PaymentStatus.UNPAID);
        } else if (paid.compareTo(total) < 0) {
            reservation.setPaymentStatus(PaymentStatus.PARTIALLY_PAID);
        } else {
            reservation.setPaymentStatus(PaymentStatus.PAID);
        }

        return reservationRepository.update(reservation);
    }

    @Transactional
    public void delete(Long id) {
        Reservation reservation = reservationRepository.findById(id);
        if (reservation == null) {
            throw new IllegalArgumentException("Reservation not found");
        }
        // Logical cancel instead of physical delete to avoid FK issues
        // (payments/service items can remain linked for audit/history).
        reservation.setStatus(ReservationStatus.CANCELED);
        reservationRepository.update(reservation);
    }

    private void validateDates(Reservation reservation) {
        if (reservation.getCheckInDate() == null || reservation.getCheckOutDate() == null) {
            throw new IllegalArgumentException("Check-in and check-out dates are required");
        }
        if (!reservation.getCheckOutDate().isAfter(reservation.getCheckInDate())) {
            throw new IllegalArgumentException("Check-out date must be after check-in date");
        }
    }

    private void applyServiceItems(Reservation reservation, java.util.Set<ServiceItem> requestedItems) {
        java.util.Set<ServiceItem> normalizedItems = new java.util.LinkedHashSet<>();
        if (requestedItems != null) {
            for (ServiceItem requestedItem : requestedItems) {
                if (requestedItem == null) {
                    continue;
                }

                Service requestedService = requestedItem.getService();
                Long serviceId = requestedService != null ? requestedService.getId() : null;
                if (serviceId == null) {
                    throw new IllegalArgumentException("Each service item must reference a service ID");
                }

                Service service = serviceRepository.findById(serviceId);
                if (service == null) {
                    throw new IllegalArgumentException("Service not found: " + serviceId);
                }

                int quantity = Math.max(1, requestedItem.getQuantity());
                BigDecimal priceAtTime = service.getPrice() == null ? BigDecimal.ZERO : service.getPrice();

                ServiceItem normalizedItem = new ServiceItem();
                normalizedItem.setService(service);
                normalizedItem.setQuantity(quantity);
                normalizedItem.setPriceAtTime(priceAtTime);
                normalizedItem.setReservation(reservation);
                normalizedItems.add(normalizedItem);
            }
        }

        reservation.setServiceItems(normalizedItems);
    }

}
