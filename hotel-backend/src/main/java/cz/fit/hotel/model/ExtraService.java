package cz.fit.hotel.model;

import jakarta.json.bind.annotation.JsonbTransient;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "extra_service")
public class ExtraService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price = BigDecimal.ZERO;

    @Column
    private String description;

    @JsonbTransient
    @OneToMany(mappedBy = "service")
    private Set<ReservationExtraService> extraServices = new HashSet<>();

    public ExtraService() {
    }

    public ExtraService(String name, BigDecimal price, String description) {
        this.name = name;
        this.price = price;
        this.description = description;
    }

    public Long getId() {
        return id;
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

    public Set<ReservationExtraService> getExtraServices() {
        return extraServices;
    }

    public void addReservationExtra(ReservationExtraService extra) {
        extraServices.add(extra);
        extra.setExtraService(this);
    }

    public void removeReservationExtra(ReservationExtraService extra) {
        extraServices.remove(extra);
        extra.setExtraService(null);
    }
}