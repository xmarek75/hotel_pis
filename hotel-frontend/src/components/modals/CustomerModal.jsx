import { useState } from "react";
import BaseModal from "./BaseModal";
import { createPortal } from "react-dom";
import { useCustomers, useUpsertCustomer } from "../../queries/useCustomers";

export default function CustomerModal({customerId, onClose}) {
  const { data: customer, isLoading } = useCustomers({
      select: (services) => services.find((s) => s.id === customerId),
    });

  const { mutate, isPending, error: mutationError } = useUpsertCustomer();

  const [form, setForm] = useState(() => {
    if (customer) {
      return {
        id: customer.id ?? "",
        name: customer.name ?? "",
        dateOfBirth: customer.dateOfBirth ?? "",
        email: customer.email ?? "",
        phone: customer.phone ?? "",
      };
    }
    return { id: "", name: "", dateOfBirth: "", email: "", phone: "" };
  });
  const [successMessage, setSuccessMessage] = useState("");

  const updateForm = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    const payload = { 
      ...form, 
      id: customerId || form.id,
    };

    setSuccessMessage("");

    mutate(payload, {
      onSuccess: (data) => {
        setSuccessMessage(form?.id ? "Zákazník byl úspěšně uložen." : "Zákazník byl úspěšně vytvořen.");
        
        if (!customerId && data?.id) {
          updateForm("id", data.id);
        }
      }
    });
  }

  return createPortal((
    <BaseModal title={customerId ? "Upravit zákazníka": "Přidat zákazníka"} onClose={onClose}>
      {isLoading ? (
        <p>Načítání...</p>
      ) : (
        <>
          {/* customer form */}
          <div className="reservation-form-grid">
          <label>
            <span>Jméno</span>
            <input value={form.name} onChange={(e) => updateForm("name", e.target.value)} />
          </label>
          <label>
            <span>Datum narození</span>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => updateForm("dateOfBirth", e.target.value)}
            />
          </label>
          <label>
            <span>E-mail</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateForm("email", e.target.value)}
            />
          </label>
          <label>
            <span>Telefon</span>
            <input value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} />
          </label>
        </div>

          {/* error message */}
          {mutationError && (
            <p className="status status--error">
              {mutationError.message}
            </p>
          )}

          {/* success message */}
          {successMessage && (
            <p className="status status--success">
              {successMessage}
            </p>
          )}

          {/* action buttons */}          
          <div className="reservation-actions">
            <button className="btn btn--secondary" type="button" onClick={onClose}>
              Zrušit
            </button>
            <button className="btn btn--primary" type="button" disable={isPending} onClick={handleSubmit}>
              {form?.id ? "Uložit zákazníka" : "Vytvořit zákazníka"}              
            </button>
          </div>
        </>
      )}
    </BaseModal>
  ), document.body);
}