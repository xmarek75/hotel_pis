package cz.fit.hotel.business;

import cz.fit.hotel.model.Employee;
import cz.fit.hotel.model.Reservation;
import cz.fit.hotel.model.ReservationChangeLog;
import cz.fit.hotel.repository.ReservationChangeLogRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

/**
 * Manager class for handling reservation audit logs.
 */
@ApplicationScoped
public class ReservationChangeLogManager {

    @Inject
    ReservationChangeLogRepository repository;

    /**
     * Retrieves the history of changes for all reservations.
     */
    public List<ReservationChangeLog> getAllHistory() {
        return repository.findAll();
    }

    /**
     * Retrieves the history of changes for a specific reservation.
     */
    public List<ReservationChangeLog> getHistory(Long reservationId) {
        return repository.findByReservationId(reservationId);
    }

    /**
     * Logs a change in a specific field of a reservation.
     * 
     * @param reservation The reservation that was changed.
     * @param actor The employee who made the change.
     * @param fieldName The name of the field being logged.
     * @param oldValue The previous value.
     * @param newValue The new value.
     */
    @Transactional
    public void logChange(Reservation reservation, Employee actor, String fieldName, Object oldValue, Object newValue) {
        // Only log if the values are actually different
        if (Objects.equals(oldValue, newValue)) {
            return;
        }

        ReservationChangeLog log = new ReservationChangeLog();
        log.setReservation(reservation);
        log.setEmployee(actor);
        log.setFieldName(fieldName);
        log.setOldValue(oldValue != null ? oldValue.toString() : null);
        log.setNewValue(newValue != null ? newValue.toString() : null);
        log.setChangeDate(LocalDateTime.now());

        repository.save(log);
    }
}
