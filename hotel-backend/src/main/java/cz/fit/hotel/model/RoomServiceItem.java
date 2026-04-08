package cz.fit.hotel.model;

import jakarta.persistence.*;

@Entity
@Table(name = "room_service_item")
public class RoomServiceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private boolean includedInPrice = false;

    @Column(nullable = false)
    private boolean active = true;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    private Service service;

    public RoomServiceItem() {
    }

    public RoomServiceItem(Room room, Service service, boolean includedInPrice) {
        this.room = room;
        this.service = service;
        this.includedInPrice = includedInPrice;
    }

    public Long getId() {
        return id;
    }

    public boolean isIncludedInPrice() {
        return includedInPrice;
    }

    public void setIncludedInPrice(boolean includedInPrice) {
        this.includedInPrice = includedInPrice;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Room getRoom() {
        return room;
    }

    public void setRoom(Room room) {
        this.room = room;
    }

    public Service getService() {
        return service;
    }

    public void setService(Service service) {
        this.service = service;
    }
}
