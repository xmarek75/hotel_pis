import { createPortal } from "react-dom";
import BaseModal from "./BaseModal";
import { useRoomAmenities, useUpsertRoomAmenity } from "../../queries/useRooms";
import { useState } from "react";

export default function RoomAmenityModal({ amenityId, onClose }) {
  const { data: amenity, isLoading } = useRoomAmenities({
    select: (amenities) => amenities.find((a) => a.id === amenityId),
  });

  const { mutate, isPending, error: mutationError } = useUpsertRoomAmenity();

  const [form, setForm] = useState({
    id: amenity?.id ?? "",
    name: amenity?.name ?? "",
    description: amenity?.description ?? "",
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
      setValidationError("Název vybavení nesmí být prázdný.");
      return;
    }

    const payload = { 
      ...form, 
      id: amenityId || form.id,
    };

    mutate(payload, {
      onSuccess: (data) => {
        const msg = form?.id ? "Vybavení pokoje bylo úspěšně uloženo." : "Vybavení pokoje bylo úspěšně vytvořeno.";
        setSuccessMessage(msg);
        
        if (!amenityId && data?.id) {
          updateForm("id", data.id);
        }
      }
    });
  };
  
  return createPortal((
    <BaseModal title={amenityId ? "Upravit vybavení pokoje": "Přidat vybavení pokoje"} onClose={onClose}>
      {isLoading ? (
        <p>Načítání...</p>
      ) : (
        <>
          <div className="reservation-form-grid">
            <label>
              <span>Název vybavení pokoje</span>
              <input 
                placeholder="Např. Klimatizace nebo Wi-Fi"
                value={form.name} 
                onChange={(e) => handleInputChange("name", e.target.value)} 
              />
            </label>
            <label className="reservation-form-grid__full">
              <span>Popis</span>
              <textarea
                rows={3}
                placeholder="Doplňující informace o vybavení..."
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
              {form?.id ? "Uložit vybavení pokoje" : "Vytvořit vybavení pokoje"}              
            </button>
          </div>
        </>
      )}
    </BaseModal>
  ), document.body);
}