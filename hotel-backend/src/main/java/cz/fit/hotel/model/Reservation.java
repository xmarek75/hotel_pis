package cz.fit.hotel.model;

import jakarta.json.bind.annotation.JsonbTransient;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Period;
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

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalPrice = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

    @Column(length = 1024)
    private String specialRequests;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    // Frontend pri vytvareni/prehledovych odpovedich pracuje primarne s ID,
    // proto si entita nese i transient pole vedle JPA vazeb.
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

    // Service items serializujeme ven, aby frontend videl vybrane doplnkove sluzby.
    @OneToMany(mappedBy = "reservation", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ServiceItem> serviceItems = new HashSet<>();

    @JsonbTransient
    @OneToMany(mappedBy = "reservation", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Payment> payments = new HashSet<>();

    public Reservation() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public void updateReservationStatus(ReservationStatus status) {
        setStatus(status);
    }

    public Integer getNumberOfGuests() {
        return numberOfGuests;
    }

    public void setNumberOfGuests(Integer numberOfGuests) {
        this.numberOfGuests = numberOfGuests;
    }

    public BigDecimal getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(BigDecimal totalPrice) {
        this.totalPrice = totalPrice;
    }

    public BigDecimal calculateTotalPrice() {
        // Cena rezervace je vzdy odvozena z aktualne prirazeneho pokoje a snapshotu sluzeb.
        long nights = Math.max(1, getReservationLength());
        BigDecimal roomPart = room == null || room.getPricePerNight() == null
                ? BigDecimal.ZERO
                : room.getPricePerNight().multiply(BigDecimal.valueOf(nights));

        BigDecimal servicesPart = BigDecimal.ZERO;
        if (serviceItems != null) {
            for (ServiceItem item : serviceItems) {
                if (item == null) {
                    continue;
                }
                item.recalculateTotal();
                servicesPart = servicesPart.add(item.getTotalPrice());
            }
        }
        return roomPart.add(servicesPart);
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

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
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

    public void assignRoom(Room room) {
        this.room = room;
    }

    public Employee getEmployee() {
        return employee;
    }

    public void setEmployee(Employee employee) {
        this.employee = employee;
    }

    public Set<ServiceItem> getServiceItems() {
        return serviceItems;
    }

    public void setServiceItems(Set<ServiceItem> serviceItems) {
        this.serviceItems = serviceItems;
    }

    public Set<Payment> getPayments() {
        return payments;
    }

    public void setPayments(Set<Payment> payments) {
        this.payments = payments;
    }

    public long getReservationLength() {
        if (checkInDate == null || checkOutDate == null) {
            return 0;
        }
        return Math.max(1, java.time.temporal.ChronoUnit.DAYS.between(checkInDate, checkOutDate));
    }

    public Long getRoomId() {
        // Pri cteni preferujeme realnou JPA vazbu, pri create/update payloadu fallbackneme na transient ID.
        if (room != null && room.getId() != null) {
            return room.getId();
        }
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }

    public String getRoomNumber() {
        // Odvozene gettery jsou tu kvuli jednoduchym odpovedim pro frontend bez extra DTO vrstvy.
        return room != null ? room.getNumber() : null;
    }

    public String getRoomType() {
        return room != null ? room.getType() : null;
    }

    public BigDecimal getRoomPricePerNight() {
        return room != null ? room.getPricePerNight() : null;
    }

    public Integer getRoomCapacity() {
        return room != null ? room.getCapacity() : null;
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

    public Integer getCustomerAge() {
        if (customer == null || customer.getDateOfBirth() == null) {
            return null;
        }
        LocalDate dob = customer.getDateOfBirth();
        if (dob.isAfter(LocalDate.now())) {
            return null;
        }
        return Period.between(dob, LocalDate.now()).getYears();
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

    public String getEmployeeName() {
        return employee != null ? employee.getName() : null;
    }

    public String getEmployeeUsername() {
        return employee != null ? employee.getUsername() : null;
    }

    public String getEmployeeRole() {
        return employee != null && employee.getRole() != null ? employee.getRole().name() : null;
    }
}
