package cz.fit.hotel.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "cash_payment")
public class CashPayment extends Payment {

    @Column(nullable = false)
    private String receiptNumber;

    public String getReceiptNumber() {
        return receiptNumber;
    }

    public void setReceiptNumber(String receiptNumber) {
        this.receiptNumber = receiptNumber;
    }

    @Override
    public boolean verifyPaymentDetails() {
        return receiptNumber != null && !receiptNumber.isBlank();
    }
}
