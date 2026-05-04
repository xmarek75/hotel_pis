import { createPortal } from "react-dom";
import BaseModal from "./BaseModal";
import { useRoomAmenities, useUpsertRoomAmenity } from "../../queries/useRooms";
import { useState } from "react";

export default function RoomAmenityModal({amenityId, onClose}) {
  const { data: amenity, isLoading } = useRoomAmenities({
    select: (amenities) => amenities.find((a) => a.id === amenityId),
  });

  const { mutate, isPending, error: mutationError } = useUpsertRoomAmenity();

  const [form, setForm] = useState(() => {
    if (amenity) {
      return {
        id: amenity.id ?? "",
        name: amenity.name ?? "",
        description: amenity.description ?? "",
      };
    }
    return { id: "", name: "", description: "" };
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
      id: amenityId || form.id,
    };

    setSuccessMessage("");

    mutate(payload, {
      onSuccess: (data) => {
        setSuccessMessage(form?.id ? "Vybavení pokoje bylo úspěšně uloženo." : "Vybavení pokoje bylo úspěšně vytvořeno.");
        
        if (!amenityId && data?.id) {
          updateForm("id", data.id);
        }
      }
    });
  }
  
  return createPortal((
    <BaseModal title={amenityId ? "Upravit vybavení pokoje": "Přidat vybavení pokoje"} onClose={onClose}>
      {isLoading ? (
        <p>Načítání...</p>
      ) : (
        <>
          {/* amenity form */}
          <div className="reservation-form-grid">
            <label>
              <span>Název vybavení pokoje</span>
              <input value={form.name} onChange={(e) => updateForm("name", e.target.value)} />
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
            <button className="btn btn--primary" type="button" disabled={isPending} onClick={handleSubmit}>
              {form?.id ? "Uložit vybavení pokoje" : "Vytvořit vybavení pokoje"}              
            </button>
          </div>
        </>
      )}
    </BaseModal>
  ), document.body);
}