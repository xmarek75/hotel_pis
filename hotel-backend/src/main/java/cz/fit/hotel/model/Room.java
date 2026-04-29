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

    @ManyToOne(optional = false)
    @JoinColumn(name = "type_id")
    private RoomType type;

    @Column(nullable = false)
    private Integer capacity;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal pricePerNight = BigDecimal.ZERO;

    @ManyToMany
    @JoinTable(
            name = "room_room_service",
            joinColumns = @JoinColumn(name = "room_id"),
            inverseJoinColumns = @JoinColumn(name = "service_id")
    )
    private Set<RoomService> services = new HashSet<>();

    @JsonbTransient
    @OneToMany(mappedBy = "room")
    private Set<Reservation> reservations = new HashSet<>();

    public Room() {
    }

    public Room(String number, Integer capacity, BigDecimal pricePerNight, RoomType type) {
        this.number = number;
        this.capacity = capacity;
        this.pricePerNight = pricePerNight;
        this.type = type;
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

    public RoomType getType() {
        return type;
    }

    public void setType(RoomType type) {
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

    public Set<RoomService> getServices() {
        return services;
    }

    public void setServices(Set<RoomService> services) {
        this.services.clear();
        if (services == null) {
            return;
        }
        this.services.addAll(services);
    }

    public Set<Reservation> getReservations() {
        return reservations;
    }

    public void addService(RoomService service) {
        services.add(service);
        service.getRooms().add(this);
    }

    public void removeService(RoomService service) {
        services.remove(service);
        service.getRooms().remove(this);
    }

    public void addReservation(Reservation reservation) {
        reservations.add(reservation);
        reservation.setRoom(this);
    }

    public void removeReservation(Reservation reservation) {
        reservations.remove(reservation);
        reservation.setRoom(null);
    }
}
