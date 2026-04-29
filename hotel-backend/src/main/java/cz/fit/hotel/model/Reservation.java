package cz.fit.hotel.model;

import jakarta.json.bind.annotation.JsonbTransient;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "reservation")
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate checkInDate;

    @Column(nullable = false)
    private LocalDate checkOutDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReservationStatus status = ReservationStatus.PENDING;

    @Column(nullable = false)
    private Integer numberOfGuests;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(length = 1024)
    private String specialRequests;

    @Transient
    private Long roomId;

    @Transient
    private Long customerId;

    @Transient
    private Long employeeId;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    @JsonbTransient
    private Customer customer;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    @JsonbTransient
    private Room room;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonbTransient
    private Employee employee;

    @OneToMany(mappedBy = "reservation", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ReservationExtraService> extraServices = new HashSet<>();

    @JsonbTransient
    @OneToMany(mappedBy = "reservation", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Payment> payments = new HashSet<>();

    public Reservation() {
    }

    public Reservation(LocalDate checkInDate, LocalDate checkOutDate, Integer numberOfGuests, String specialRequests) {
        this.checkInDate = checkInDate;
        this.checkOutDate = checkOutDate;
        this.numberOfGuests = numberOfGuests;
        this.specialRequests = specialRequests;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public LocalDate getCheckInDate() {
        return checkInDate;
    }

    public void setCheckInDate(LocalDate checkInDate) {
        this.checkInDate = checkInDate;
    }

    public LocalDate getCheckOutDate() {
        return checkOutDate;
    }

    public void setCheckOutDate(LocalDate checkOutDate) {
        this.checkOutDate = checkOutDate;
    }

    public ReservationStatus getStatus() {
        return status;
    }

    public void setStatus(ReservationStatus status) {
        this.status = status;
    }

    public Integer getNumberOfGuests() {
        return numberOfGuests;
    }

    public void setNumberOfGuests(Integer numberOfGuests) {
        this.numberOfGuests = numberOfGuests;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(PaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getSpecialRequests() {
        return specialRequests;
    }

    public void setSpecialRequests(String specialRequests) {
        this.specialRequests = specialRequests;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

    public Room getRoom() {
        return room;
    }

    public void setRoom(Room room) {
        this.room = room;
    }

    public Employee getEmployee() {
        return employee;
    }

    public void setEmployee(Employee employee) {
        this.employee = employee;
    }

    public Set<ReservationExtraService> getExtraServices() {
        return extraServices;
    }

    public void setExtraServices(Set<ReservationExtraService> extraServices) {
        this.extraServices.clear();
        if (extraServices == null) {
            return;
        }
        for (ReservationExtraService item : extraServices) {
            if (item == null) {
                continue;
            }
            item.setReservation(this);
            this.extraServices.add(item);
        }
    }

    public void addExtraService(ReservationExtraService extraService) {
        extraServices.add(extraService);
        extraService.setReservation(this);
    }

    public void removeExtraService(ReservationExtraService extraService) {
        extraServices.remove(extraService);
        extraService.setReservation(null);
    }

    public Set<Payment> getPayments() {
        return payments;
    }

    public void addPayment(Payment payment) {
        payments.add(payment);
        payment.setReservation(this);
    }

    public Long getRoomId() {
        if (room != null && room.getId() != null) {
            return room.getId();
        }
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }

    public Long getCustomerId() {
        if (customer != null && customer.getId() != null) {
            return customer.getId();
        }
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public Long getEmployeeId() {
        if (employee != null && employee.getId() != null) {
            return employee.getId();
        }
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    // Frontend works with a flattened reservation shape, so expose derived fields directly.
    public String getRoomNumber() {
        return room != null ? room.getNumber() : null;
    }

    public String getRoomType() {
        return room != null && room.getType() != null ? room.getType().getName() : null;
    }

    public Integer getRoomCapacity() {
        return room != null ? room.getCapacity() : null;
    }

    public BigDecimal getRoomPricePerNight() {
        return room != null ? room.getPricePerNight() : null;
    }

    public String getCustomerName() {
        return customer != null ? customer.getName() : null;
    }

    public String getCustomerEmail() {
        return customer != null ? customer.getEmail() : null;
    }

    public String getCustomerPhone() {
        return customer != null ? customer.getPhone() : null;
    }

    public LocalDate getCustomerDateOfBirth() {
        return customer != null ? customer.getDateOfBirth() : null;
    }

    public String getEmployeeName() {
        return employee != null ? employee.getName() : null;
    }

    public String getEmployeeUsername() {
        return employee != null ? employee.getUsername() : null;
    }

    public EmployeeRole getEmployeeRole() {
        return employee != null ? employee.getRole() : null;
    }

    public BigDecimal getTotalPrice() {
        BigDecimal total = BigDecimal.ZERO;
        if (room != null && room.getPricePerNight() != null && checkInDate != null && checkOutDate != null) {
            long nights = java.time.temporal.ChronoUnit.DAYS.between(checkInDate, checkOutDate);
            if (nights > 0) {
                total = total.add(room.getPricePerNight().multiply(BigDecimal.valueOf(nights)));
            }
        }
        for (ReservationExtraService item : extraServices) {
            if (item != null && item.getTotalPrice() != null) {
                total = total.add(item.getTotalPrice());
            }
        }
        return total;
    }

    public Set<ReservationExtraService> getServiceItems() {
        return getExtraServices();
    }

    public void setServiceItems(Set<ReservationExtraService> serviceItems) {
        setExtraServices(serviceItems);
    }
}
