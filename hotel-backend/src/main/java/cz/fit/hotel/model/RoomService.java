package cz.fit.hotel.model;

import jakarta.persistence.*;
import jakarta.json.bind.annotation.JsonbTransient;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "room_service")
public class RoomService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column
    private String description;

    @JsonbTransient
    @ManyToMany(mappedBy = "services")
    private Set<Room> rooms = new HashSet<>();

    public RoomService() {
    }

    public RoomService(String name, String description) {
        this.name = name;
        this.description = description;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Set<Room> getRooms() {
        return rooms;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
