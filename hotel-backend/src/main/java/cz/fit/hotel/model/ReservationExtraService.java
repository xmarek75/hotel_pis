package cz.fit.hotel.model;

import jakarta.json.bind.annotation.JsonbTransient;
import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "reservation_extra_service")
public class ReservationExtraService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private int quantity = 1;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal priceAtTime = BigDecimal.ZERO;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    private ExtraService service;

    @JsonbTransient
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id", nullable = false)
    private Reservation reservation;

    public ReservationExtraService() {
    }

    public ReservationExtraService(ExtraService service, int quantity, BigDecimal priceAtTime) {
        this.service = service;
        this.quantity = quantity;
        this.priceAtTime = priceAtTime;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getPriceAtTime() {
        return priceAtTime;
    }

    public void setPriceAtTime(BigDecimal priceAtTime) {
        this.priceAtTime = priceAtTime;
    }

    public BigDecimal getTotalPrice() {
        if (priceAtTime == null) return BigDecimal.ZERO;
        return priceAtTime.multiply(new BigDecimal(quantity));
    }

    public ExtraService getExtraService() {
        return service;
    }

    public void setExtraService(ExtraService service) {
        this.service = service;
    }

    public Reservation getReservation() {
        return reservation;
    }

    public void setReservation(Reservation reservation) {
        this.reservation = reservation;
    }
}
