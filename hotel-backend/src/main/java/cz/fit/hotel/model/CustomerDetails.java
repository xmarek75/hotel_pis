package cz.fit.hotel.model;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class CustomerDetails {

    private Customer customer;
    private long reservationCount;
    private LocalDate lastStayDate;
    private boolean hasActiveReservation;
    private List<Reservation> customerReservations = new ArrayList<>();

    public CustomerDetails() {
    }

    public CustomerDetails(Customer customer, long reservationCount, LocalDate lastStayDate,
                           boolean hasActiveReservation, List<Reservation> customerReservations) {
        this.customer = customer;
        this.reservationCount = reservationCount;
        this.lastStayDate = lastStayDate;
        this.hasActiveReservation = hasActiveReservation;
        setCustomerReservations(customerReservations);
    }

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

    public long getReservationCount() {
        return reservationCount;
    }

    public void setReservationCount(long reservationCount) {
        this.reservationCount = reservationCount;
    }

    public LocalDate getLastStayDate() {
        return lastStayDate;
    }

    public void setLastStayDate(LocalDate lastStayDate) {
        this.lastStayDate = lastStayDate;
    }

    public boolean isHasActiveReservation() {
        return hasActiveReservation;
    }

    public void setHasActiveReservation(boolean hasActiveReservation) {
        this.hasActiveReservation = hasActiveReservation;
    }

    public List<Reservation> getCustomerReservations() {
        return customerReservations;
    }

    public void setCustomerReservations(List<Reservation> customerReservations) {
        this.customerReservations = customerReservations == null
                ? new ArrayList<>()
                : new ArrayList<>(customerReservations);
    }
}
