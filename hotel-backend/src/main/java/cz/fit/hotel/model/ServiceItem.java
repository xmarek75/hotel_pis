package cz.fit.hotel.model;

import jakarta.json.bind.annotation.JsonbTransient;
import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "service_item")
public class ServiceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private int quantity = 1;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal priceAtTime = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalPrice = BigDecimal.ZERO;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    private Service service;

    @JsonbTransient
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id", nullable = false)
    private Reservation reservation;

    public ServiceItem() {
    }

    public ServiceItem(Service service, int quantity, BigDecimal priceAtTime) {
        this.service = service;
        this.quantity = quantity;
        this.priceAtTime = priceAtTime;
        recalculateTotal();
    }

    public Long getId() {
        return id;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
        recalculateTotal();
    }

    public BigDecimal getPriceAtTime() {
        return priceAtTime;
    }

    public void setPriceAtTime(BigDecimal priceAtTime) {
        this.priceAtTime = priceAtTime;
        recalculateTotal();
    }

    public BigDecimal getTotalPrice() {
        return totalPrice;
    }

    public Service getService() {
        return service;
    }

    public void setService(Service service) {
        this.service = service;
    }

    public Reservation getReservation() {
        return reservation;
    }

    public void setReservation(Reservation reservation) {
        this.reservation = reservation;
    }

    public void recalculateTotal() {
        BigDecimal qty = BigDecimal.valueOf(Math.max(1, quantity));
        this.totalPrice = (priceAtTime == null ? BigDecimal.ZERO : priceAtTime).multiply(qty);
    }
}
