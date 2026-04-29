package cz.fit.hotel.model;

import jakarta.persistence.*;
import jakarta.json.bind.annotation.JsonbTransient;
import java.util.Set;
import java.util.HashSet;

@Entity
@Table(name = "room_type")
public class RoomType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @JsonbTransient
    @OneToMany(mappedBy = "type")
    private Set<Room> rooms = new HashSet<>();

    public RoomType() {
    }

    public RoomType(String name) {
        this.name = name;
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

    public Set<Room> getRooms() {
        return rooms;
    }

    public void addRoom(Room room) {
        rooms.add(room);
        room.setType(this);
    }

    public void removeRoom(Room room) {
        rooms.remove(room);
        room.setType(null);
    }
}
