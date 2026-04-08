package cz.fit.hotel.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "card_payment")
public class CardPayment extends Payment {

    @Column(nullable = false)
    private String transactionId;

    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    @Override
    public boolean verifyPaymentDetails() {
        return transactionId != null && !transactionId.isBlank();
    }
}
