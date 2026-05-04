import { useState } from "react";
import { useServices, useUpsertService } from "../../queries/useServices";
import BaseModal from "./BaseModal";
import { createPortal } from "react-dom";

export default function ServiceModal({ serviceId, onClose }) {
  const { data: service, isLoading } = useServices({
    select: (services) => services.find((s) => s.id === serviceId),
  });

  const { mutate, isPending, error: mutationError } = useUpsertService();

  const [form, setForm] = useState(({
    id: service?.id ?? "",
    name: service?.name ?? "",
    price: service?.price ?? "",
    description: service?.description ?? "",
  }));

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
      setValidationError("Název služby nesmí být prázdný.");
      return;
    }

    const parsedPrice = parseFloat(form.price);
    if (isNaN(parsedPrice) || form.price === "") {
      setValidationError("Cena musí být platné číslo.");
      return;
    }

    const payload = { 
      ...form, 
      id: serviceId || form.id,
      price: parsedPrice
    };

    mutate(payload, {
      onSuccess: (data) => {
        const msg = form?.id ? "Služba byla úspěšně uložena." : "Služba byla úspěšně vytvořená.";
        setSuccessMessage(msg);
        
        if (!serviceId && data?.id) {
          updateForm("id", data.id);
        }
      }
    });
  }

  return createPortal((
    <BaseModal title={serviceId ? "Upravit službu": "Přidat službu"} onClose={onClose}>
      {isLoading ? (
        <p>Načítání...</p>
      ) : (
        <>
          <div className="reservation-form-grid">
            <label>
              <span>Název služby</span>
              <input 
                placeholder="Např. Masáž lávovými kameny"
                value={form.name} 
                onChange={(e) => handleInputChange("name", e.target.value)} 
              />
            </label>
            <label>
              <span>Cena</span>
              <input
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
              />
            </label>
            <label className="reservation-form-grid__full">
              <span>Popis</span>
              <textarea
                rows={3}
                placeholder="Krátký popis služby..."
                value={form.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
              />
            </label>
          </div>

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
              {form?.id ? "Uložit službu" : "Vytvořit službu"}              
            </button>
          </div>
        </>
      )}
    </BaseModal>
  ), document.body);
}