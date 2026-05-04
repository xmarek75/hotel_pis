import { useState } from "react";
import { useServices, useUpsertService } from "../../queries/useServices";
import BaseModal from "./BaseModal";
import { createPortal } from "react-dom";

export default function ServiceModal({serviceId, onClose}) {
  const { data: service, isLoading } = useServices({
      select: (services) => services.find((s) => s.id === serviceId),
    });

  const { mutate, isPending, error: mutationError } = useUpsertService();

  const [form, setForm] = useState(() => {
    if (service) {
      return {
        id: service.id ?? "",
        name: service.name ?? "",
        price: service.price ?? "",
        description: service.description ?? "",
      };
    }
    return { id: "", name: "", price: 0, description: "" };
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
      id: serviceId || form.id,
      price: parseFloat(form.price)
    };

    setSuccessMessage("");

    mutate(payload, {
      onSuccess: (data) => {
        setSuccessMessage(form?.id ? "Služba byla úspěšně uložena." : "Služba byla úspěšně vytvořena.");
        
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
          {/* service form */}
          <div className="reservation-form-grid">
            <label>
              <span>Název služby</span>
              <input value={form.name} onChange={(e) => updateForm("name", e.target.value)} />
            </label>
            <label>
              <span>Cena</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(e) => updateForm("price", e.target.value)}
              />
            </label>
            <label className="reservation-form-grid__full">
              <span>Popis</span>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
              />
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
              {form?.id ? "Uložit službu" : "Vytvořit službu"}              
            </button>
          </div>
        </>
      )}
    </BaseModal>
  ), document.body);
}