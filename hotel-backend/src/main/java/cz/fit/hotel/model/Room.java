package cz.fit.hotel.model;

import jakarta.json.bind.annotation.JsonbTransient;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "room")
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String number;

    @Column(nullable = false)
    private String type = "STANDARD";

    @Column(nullable = false)
    private Integer capacity;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal pricePerNight = BigDecimal.ZERO;

    @Column(nullable = false)
    private boolean active = true;

    @JsonbTransient
    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<RoomServiceItem> serviceItems = new HashSet<>();

    @JsonbTransient
    @OneToMany(mappedBy = "room")
    private Set<Reservation> reservations = new HashSet<>();

    public Room() {
    }

    public Room(String number, Integer capacity, BigDecimal pricePerNight) {
        this.number = number;
        this.capacity = capacity;
        this.pricePerNight = pricePerNight;
    }

    public Long getId() {
        return id;
    }

    public String getNumber() {
        return number;
    }

    public void setNumber(String number) {
        this.number = number;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public BigDecimal getPricePerNight() {
        return pricePerNight;
    }

    public void setPricePerNight(BigDecimal pricePerNight) {
        this.pricePerNight = pricePerNight;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Set<RoomServiceItem> getServiceItems() {
        return serviceItems;
    }

    public void setServiceItems(Set<RoomServiceItem> serviceItems) {
        this.serviceItems = serviceItems;
    }

    public Set<Reservation> getReservations() {
        return reservations;
    }

    public void setReservations(Set<Reservation> reservations) {
        this.reservations = reservations;
    }

    public boolean isAvailableForGuests(int guests) {
        return active && guests > 0 && capacity != null && guests <= capacity;
    }

    public boolean isAvailableBetween(LocalDate from, LocalDate to) {
        if (!active || from == null || to == null || !to.isAfter(from)) {
            return false;
        }
        for (Reservation reservation : reservations) {
            if (reservation == null || reservation.getStatus() == ReservationStatus.CANCELED) {
                continue;
            }
            if (reservation.getCheckInDate() != null
                    && reservation.getCheckOutDate() != null
                    && reservation.getCheckInDate().isBefore(to)
                    && reservation.getCheckOutDate().isAfter(from)) {
                return false;
            }
        }
        return true;
    }

    public List<Service> getServices() {
        List<Service> services = new ArrayList<>();
        for (RoomServiceItem serviceItem : serviceItems) {
            if (serviceItem != null && serviceItem.isActive() && serviceItem.getService() != null) {
                services.add(serviceItem.getService());
            }
        }
        return services;
    }
}
