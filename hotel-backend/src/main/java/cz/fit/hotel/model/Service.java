package cz.fit.hotel.model;

import jakarta.json.bind.annotation.JsonbTransient;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "service")
public class Service {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price = BigDecimal.ZERO;

    @Column(nullable = false)
    private String description;

    @JsonbTransient
    @OneToMany(mappedBy = "service", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<RoomServiceItem> roomServiceItems = new HashSet<>();

    @JsonbTransient
    @OneToMany(mappedBy = "service")
    private Set<ServiceItem> serviceItems = new HashSet<>();

    public Service() {
    }

    public Service(String name, BigDecimal price, String description) {
        this.name = name;
        this.price = price;
        this.description = description;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Set<RoomServiceItem> getRoomServiceItems() {
        return roomServiceItems;
    }

    public void setRoomServiceItems(Set<RoomServiceItem> roomServiceItems) {
        this.roomServiceItems = roomServiceItems;
    }

    public Set<ServiceItem> getServiceItems() {
        return serviceItems;
    }

    public void setServiceItems(Set<ServiceItem> serviceItems) {
        this.serviceItems = serviceItems;
    }

    public BigDecimal calculatePrice(int quantity) {
        // Cenik sluzeb ma byt robustni i pri nekorektnim mnozstvi z UI.
        int normalizedQuantity = Math.max(1, quantity);
        return price.multiply(BigDecimal.valueOf(normalizedQuantity));
    }
}
