import { useState } from "react";
import BaseModal from "./BaseModal";
import { createPortal } from "react-dom";
import { useCustomers, useUpsertCustomer } from "../../queries/useCustomers";

export default function CustomerModal({ customerId, onClose }) {
  const { data: customer, isLoading } = useCustomers({
    select: (customers) => customers.find((c) => c.id === customerId),
  });

  const { mutate, isPending, error: mutationError } = useUpsertCustomer();

  const [form, setForm] = useState({
    id: customer?.id ?? "",
    name: customer?.name ?? "",
    dateOfBirth: customer?.dateOfBirth ?? "",
    email: customer?.email ?? "",
    phone: customer?.phone ?? "",
  });

  const [successMessage, setSuccessMessage] = useState("");
  const [validationError, setValidationError] = useState("");

  const updateForm = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInputChange = (field, value) => {
    updateForm(field, value);
    setValidationError("");
    setSuccessMessage("");
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      setValidationError("Jméno nesmí být prázdné.");
      return;
    }

    if (!form.dateOfBirth) {
      setValidationError("Datum narození je povinné.");
      return;
    }

    if (!form.phone.trim()) {
      setValidationError("Telefon je povinný.");
      return;
    }

    const payload = {
      ...((customerId || form.id) && { id: customerId || form.id }),
      name: form.name,
      phone: form.phone,
      dateOfBirth: form.dateOfBirth,
      ...(form.email && { email: form.email })
    };

    mutate(payload, {
      onSuccess: (data) => {
        const msg = form?.id ? "Zákazník byl úspěšně uložen." : "Zákazník byl úspěšně vytvořen.";
        setSuccessMessage(msg);
        
        if (!customerId && data?.id) {
          updateForm("id", data.id);
        }
      }
    });
  };

  return createPortal((
    <BaseModal title={customerId ? "Upravit zákazníka" : "Přidat zákazníka"} onClose={onClose}>
      {isLoading ? (
        <p>Načítání...</p>
      ) : (
        <>
          <div className="reservation-form-grid">
            <label>
              <span>Jméno</span>
              <input 
                placeholder="Jan Novák"
                value={form.name} 
                onChange={(e) => handleInputChange("name", e.target.value)} 
              />
            </label>
            <label>
              <span>Datum narození</span>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
              />
            </label>
            <label>
              <span>E-mail</span>
              <input
                type="email"
                placeholder="email@domena.cz"
                value={form.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </label>
            <label>
              <span>Telefon</span>
              <input 
                placeholder="+420..."
                value={form.phone} 
                onChange={(e) => handleInputChange("phone", e.target.value)} 
              />
            </label>
          </div>

          {/* Zobrazení chyb (validace nebo server) */}
          {(mutationError || validationError) && (
            <p className="status status--error">
              {validationError || mutationError?.message}
            </p>
          )}

          {successMessage && (
            <p className="status status--success">
              {successMessage}
            </p>
          )}

          <div className="reservation-actions">
            <button className="btn btn--secondary" type="button" onClick={onClose}>
              Zrušit
            </button>
            <button 
              className="btn btn--primary" 
              type="button" 
              disabled={isPending} 
              onClick={handleSubmit}
            >
              {form?.id ? "Uložit zákazníka" : "Vytvořit zákazníka"}
            </button>
          </div>
        </>
      )}
    </BaseModal>
  ), document.body);
}