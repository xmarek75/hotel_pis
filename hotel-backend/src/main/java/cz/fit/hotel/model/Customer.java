package cz.fit.hotel.model;

import jakarta.json.bind.annotation.JsonbTransient;
import jakarta.persistence.*;

import java.time.Period;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "customer")
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private LocalDate dateOfBirth;

    @Column
    private String email;

    @Column(nullable = false, unique = true)
    private String phone;

    @JsonbTransient
    @OneToMany(mappedBy = "customer")
    private Set<Reservation> reservations = new HashSet<>();

    public Customer() {
    }

    public Customer(String name, LocalDate dateOfBirth, String email, String phone) {
        this.name = name;
        this.dateOfBirth = dateOfBirth;
        this.email = email;
        this.phone = phone;
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

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public Set<Reservation> getReservations() {
        return reservations;
    }

    public void addReservation(Reservation r) {
        reservations.add(r);
        r.setCustomer(this);
    }

    public void removeReservation(Reservation r) {
        reservations.remove(r);
        r.setCustomer(null);
    }

    public Integer getCustomerAge() {
        if (dateOfBirth == null) {
            return null;
        }
        if (dateOfBirth.isAfter(LocalDate.now())) {
            return null;
        }
        return Period.between(dateOfBirth, LocalDate.now()).getYears();
    }
}