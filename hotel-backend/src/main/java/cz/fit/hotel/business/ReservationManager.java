package cz.fit.hotel.business;

import cz.fit.hotel.model.*;
import cz.fit.hotel.repository.*;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.math.BigDecimal;
import java.time.temporal.ChronoUnit;
import java.util.List;

@ApplicationScoped
public class ReservationManager {

    @Inject
    ReservationChangeLogManager logManager;

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
    ExtraServiceRepository extraServiceRepository;

    public List<Reservation> findAll() {
        return reservationRepository.findAll();
    }

    public Reservation findById(Long id) {
        return reservationRepository.findById(id);
    }

    @Transactional
    public Reservation create(Reservation reservation) {
        validateDates(reservation);
        if (reservation.getCheckInDate().isBefore(java.time.LocalDate.now())) {
            throw new IllegalArgumentException("Cannot create a reservation in the past");
        }
        Long roomId = extractRoomId(reservation);
        Long customerId = extractCustomerId(reservation);
        Long employeeId = extractEmployeeId(reservation);

        validateGuestCount(reservation.getNumberOfGuests());

        Room room = requireActiveRoom(roomId);
        ensureRoomCanHostReservation(room, reservation);
        Customer customer = requireCustomer(customerId);
        Employee employee = resolveResponsibleEmployee(employeeId);

        reservation.setRoom(room);
        reservation.setCustomer(customer);
        reservation.setEmployee(employee);
        
        applyServiceItems(reservation, reservation.getExtraServices());
        if (reservation.getStatus() == null) {
            reservation.setStatus(ReservationStatus.PENDING);
        }

        reservation.setPaymentStatus(PaymentStatus.UNPAID);

        reservationRepository.save(reservation);
        return reservation;
    }

    @Transactional
    public Reservation updateStatus(Long id, ReservationStatus status, Employee actor) {
        Reservation reservation = reservationRepository.findById(id);
        if (reservation == null) {
            throw new IllegalArgumentException("Reservation not found");
        }
        
        ReservationStatus oldStatus = reservation.getStatus();
        reservation.setStatus(status);
        
        logManager.logChange(reservation, actor, "status", oldStatus, status);
        
        return reservationRepository.update(reservation);
    }

    @Transactional
    public Reservation update(Long id, Reservation payload, Employee actor) {
        Reservation reservation = requireReservation(id);

        boolean paymentStatusProvided = payload.getPaymentStatus() != null;

        if (payload.getCheckInDate() != null) {
            logManager.logChange(reservation, actor, "checkInDate", reservation.getCheckInDate(), payload.getCheckInDate());
            reservation.setCheckInDate(payload.getCheckInDate());
        }
        if (payload.getCheckOutDate() != null) {
            logManager.logChange(reservation, actor, "checkOutDate", reservation.getCheckOutDate(), payload.getCheckOutDate());
            reservation.setCheckOutDate(payload.getCheckOutDate());
        }
        if (payload.getNumberOfGuests() != null) {
            logManager.logChange(reservation, actor, "numberOfGuests", reservation.getNumberOfGuests(), payload.getNumberOfGuests());
            reservation.setNumberOfGuests(payload.getNumberOfGuests());
        }
        if (payload.getSpecialRequests() != null) {
            logManager.logChange(reservation, actor, "specialRequests", reservation.getSpecialRequests(), payload.getSpecialRequests());
            reservation.setSpecialRequests(payload.getSpecialRequests());
        }
        if (payload.getStatus() != null) {
            logManager.logChange(reservation, actor, "status", reservation.getStatus(), payload.getStatus());
            reservation.setStatus(payload.getStatus());
        }
        if (paymentStatusProvided) {
            logManager.logChange(reservation, actor, "paymentStatus", reservation.getPaymentStatus(), payload.getPaymentStatus());
            reservation.setPaymentStatus(payload.getPaymentStatus());
        }
        if (payload.getExtraServices() != null) {
            logManager.logChange(reservation, actor, "extraServices", "Updated", "Updated");
            applyServiceItems(reservation, payload.getExtraServices());
        }

        validateDates(reservation);

        Room room = reservation.getRoom();
        if (room == null) {
            throw new IllegalArgumentException("Room is required");
        }
        validateGuestCount(reservation.getNumberOfGuests());
        ensureRoomCanHostReservationExceptSelf(room, reservation);

        Reservation updated = reservationRepository.update(reservation);
        if (paymentStatusProvided) {
            return updated;
        }
        return refreshPaymentStatus(id);
    }

    @Transactional
    public Reservation refreshPaymentStatus(Long id) {
        Reservation reservation = requireReservation(id);

        BigDecimal paid = paymentRepository.getTotalPaidForReservation(id);
        BigDecimal total = calculateTotalPrice(reservation);
        
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
        Reservation reservation = requireReservation(id);
        // Logical cancel instead of physical delete to avoid FK issues
        // (payments/service items can remain linked for audit/history).
        reservation.setStatus(ReservationStatus.CANCELED);
        reservationRepository.update(reservation);
    }

    public List<Payment> getPaymentsByReservationId(Long id) {
        return paymentRepository.findByReservationId(id);
    }

    public cz.fit.hotel.rest.ReservationResource.PaymentSummary getPaymentSummary(Long id) {
        Reservation reservation = requireReservation(id);
        BigDecimal totalPaid = paymentRepository.getTotalPaidForReservation(id);
        BigDecimal totalCost = calculateTotalPrice(reservation);
        return new cz.fit.hotel.rest.ReservationResource.PaymentSummary(totalCost, totalPaid);
    }

    private void validateDates(Reservation reservation) {
        if (reservation.getCheckInDate() == null || reservation.getCheckOutDate() == null) {
            throw new IllegalArgumentException("Check-in and check-out dates are required");
        }
        if (!reservation.getCheckOutDate().isAfter(reservation.getCheckInDate())) {
            throw new IllegalArgumentException("Check-out date must be after check-in date");
        }
    }

    public BigDecimal calculateTotalPrice(Reservation reservation) {
        BigDecimal total = BigDecimal.ZERO;
        
        if (reservation.getRoom() != null && reservation.getRoom().getPricePerNight() != null) {
            long nights = ChronoUnit.DAYS.between(reservation.getCheckInDate(), reservation.getCheckOutDate());
            total = total.add(reservation.getRoom().getPricePerNight().multiply(new BigDecimal(nights)));
        }

        if (reservation.getExtraServices() != null) {
            for (ReservationExtraService extraService : reservation.getExtraServices()) {
                total = total.add(extraService.getTotalPrice());
            }
        }
        
        return total;
    }

    private void applyServiceItems(Reservation reservation, java.util.Set<ReservationExtraService> requestedItems) {
        java.util.Set<ReservationExtraService> normalizedItems = new java.util.LinkedHashSet<>();
        if (requestedItems != null) {
            for (ReservationExtraService requestedItem : requestedItems) {
                if (requestedItem == null) {
                    continue;
                }

                ExtraService requestedService = requestedItem.getService();
                Long serviceId = requestedService != null ? requestedService.getId() : null;
                if (serviceId == null) {
                    throw new IllegalArgumentException("Each service item must reference a service ID");
                }

                ExtraService service = extraServiceRepository.findById(serviceId);
                if (service == null) {
                    throw new IllegalArgumentException("Service not found: " + serviceId);
                }

                int quantity = Math.max(1, requestedItem.getQuantity());
                BigDecimal priceAtTime = service.getPrice() == null ? BigDecimal.ZERO : service.getPrice();
                
                ReservationExtraService normalizedItem = new ReservationExtraService();
                normalizedItem.setService(service);
                normalizedItem.setQuantity(quantity);
                normalizedItem.setPriceAtTime(priceAtTime);
                normalizedItem.setReservation(reservation);
                normalizedItems.add(normalizedItem);
            }
        }

        reservation.getExtraServices().clear();
        reservation.getExtraServices().addAll(normalizedItems);
    }

    private Reservation requireReservation(Long id) {
        Reservation reservation = reservationRepository.findById(id);
        if (reservation == null) {
            throw new IllegalArgumentException("Reservation not found");
        }
        return reservation;
    }

    private Long extractRoomId(Reservation reservation) {
        Long roomId = reservation.getRoom() != null ? reservation.getRoom().getId() : reservation.getRoomId();
        if (roomId == null) {
            throw new IllegalArgumentException("Room is required");
        }
        return roomId;
    }

    private Long extractCustomerId(Reservation reservation) {
        Long customerId = reservation.getCustomer() != null ? reservation.getCustomer().getId() : reservation.getCustomerId();
        if (customerId == null) {
            throw new IllegalArgumentException("Customer is required");
        }
        return customerId;
    }

    private Long extractEmployeeId(Reservation reservation) {
        return reservation.getEmployee() != null ? reservation.getEmployee().getId() : reservation.getEmployeeId();
    }

    private Room requireActiveRoom(Long roomId) {
        Room room = roomRepository.findById(roomId);
        if (room == null) {
            throw new IllegalArgumentException("Room not found or inactive");
        }
        return room;
    }

    private Customer requireCustomer(Long customerId) {
        Customer customer = customerRepository.findById(customerId);
        if (customer == null) {
            throw new IllegalArgumentException("Customer not found");
        }
        return customer;
    }

    private Employee resolveResponsibleEmployee(Long employeeId) {
        Employee employee = employeeId != null
                ? employeeRepository.findById(employeeId)
                : null; // Employee repository findFirstActive() missing
        if (employee == null || !employee.isActive()) {
            throw new IllegalArgumentException("Employee not found or inactive");
        }
        return employee;
    }

    private void validateGuestCount(Integer numberOfGuests) {
        if (numberOfGuests == null || numberOfGuests <= 0) {
            throw new IllegalArgumentException("Number of guests must be greater than 0");
        }
    }

    private void ensureRoomCanHostReservation(Room room, Reservation reservation) {
        if (room.getCapacity() != null && reservation.getNumberOfGuests() > room.getCapacity()) {
            throw new IllegalArgumentException("Number of guests exceeds room capacity");
        }
        if (reservationRepository.hasRoomOverlapExcludingReservation(room.getId(), reservation.getCheckInDate(), reservation.getCheckOutDate(), -1L)) {
            throw new IllegalArgumentException("Room is already reserved in the selected date range");
        }
    }

    private void ensureRoomCanHostReservationExceptSelf(Room room, Reservation reservation) {
        if (room.getCapacity() != null && reservation.getNumberOfGuests() > room.getCapacity()) {
            throw new IllegalArgumentException("Number of guests exceeds room capacity");
        }
        if (reservationRepository.hasRoomOverlapExcludingReservation(
                room.getId(), reservation.getCheckInDate(), reservation.getCheckOutDate(), reservation.getId()
        )) {
            throw new IllegalArgumentException("Room is already reserved in the selected date range");
        }
    }
}
