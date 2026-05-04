import { useState } from "react";
import { useRoomAmenities, useRooms, useRoomTypes, useUpsertRoom } from "../../queries/useRooms";
import BaseModal from "./BaseModal";
import { createPortal } from "react-dom";

export default function RoomModal({roomId, onClose}) {
  const { data: room, isLoading } = useRooms({
    select: (rooms) => rooms.find((r) => r.id === roomId),
  });
  const { data: roomAmenities, isLoading: RAIsLoading } = useRoomAmenities();
  const { data: roomTypes, isLoading: RTIsLoading } = useRoomTypes();
  const { mutate, isPending, error: mutationError } = useUpsertRoom();

  const [form, setForm] = useState({
    id: room?.id ?? "",
    number: room?.number ?? "",
    typeId: room?.type ? String(room.type.id) : "",
    typeName: room?.type ? String(room.type.name) : "",
    capacity: room?.capacity ?? 2,
    pricePerNight: room?.pricePerNight ?? "",
    roomServiceIds: Array.isArray(room?.services) ? room.services.map(s => String(s.id)) : [],
    active: room?.active !== false,
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

  const updateRoomAmenities = (id, checked) => {
    const idStr = String(id);
    setValidationError("");
    setSuccessMessage("");
  
    setForm((prev) => {
      const currentIds = Array.isArray(prev.roomServiceIds) ? prev.roomServiceIds : [];
      const nextIds = checked
        ? [...currentIds, idStr]
        : currentIds.filter((item) => String(item) !== idStr);
  
      return {
        ...prev,
        roomServiceIds: nextIds,
      };
    });
  };

  const handleSubmit = () => {
    if (!form.number.toString().trim()) {
      setValidationError("Číslo pokoje je povinné.");
      return;
    }

    if (!form.typeId && !form.typeName.trim()) {
      setValidationError("Typ pokoje musí být vybrán.");
      return;
    }

    const parsedCapacity = parseInt(form.capacity);
    if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
      setValidationError("Kapacita musí být platné číslo větší než 0.");
      return;
    }

    const parsedPrice = parseFloat(form.pricePerNight);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setValidationError("Cena musí být platné nezáporné číslo.");
      return;
    }

    const payload = { 
      ...form, 
      id: roomId || form.id,
      typeId: form.typeId ? Number(form.typeId) : null,
      capacity: parsedCapacity,
      pricePerNight: parsedPrice
    };

    mutate(payload, {
      onSuccess: (data) => {
        const msg = form?.id ? "Pokoj byl úspěšně uložen." : "Pokoj byl úspěšně vytvořen.";
        setSuccessMessage(msg);
        
        if (!roomId && data?.id) {
          updateForm("id", data.id);
        }
      }
    });
  }

  return createPortal((
    <BaseModal title={roomId ? "Upravit pokoj" : "Vytvořit nový pokoj"} onClose={onClose}>
      {isLoading || RAIsLoading || RTIsLoading ? (
        <p>Načítání...</p>
      ) : (
        <>
          <div className="reservation-form-grid">
            <label>
              <span>Číslo pokoje</span>
              <input 
                placeholder="Např. 101"
                value={form.number} 
                onChange={(e) => handleInputChange("number", e.target.value)} 
              />
            </label>
            <label>
              <span>Typ pokoje</span>
              {roomTypes.length > 0 ? (
                <select
                  value={form.typeId}
                  onChange={(e) => {
                    const selected = roomTypes.find((type) => String(type.id) === e.target.value);
                    handleInputChange("typeId", e.target.value);
                    updateForm("typeName", selected?.name ?? "");
                  }}
                >
                  <option value="">Vyber typ pokoje</option>
                  {roomTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input 
                  placeholder="Např. Deluxe"
                  value={form.typeName} 
                  onChange={(e) => handleInputChange("typeName", e.target.value)} 
                />
              )}
            </label>
            <label>
              <span>Kapacita</span>
              <input
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => handleInputChange("capacity", e.target.value)}
              />
            </label>
            <label>
              <span>Cena za noc</span>
              <input
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={form.pricePerNight}
                onChange={(e) => handleInputChange("pricePerNight", e.target.value)}
              />
            </label>
            <fieldset className="reservation-customer-box reservation-form-grid__full">
              <legend>Vybavení pokoje</legend>
              {roomAmenities.length === 0 ? (
                <div className="customer-search-hint">Nejsou dostupné žádné room services.</div>
              ) : (
                <div className="new-customer-grid">
                  {roomAmenities.map((service) => {
                    const checked = (Array.isArray(form.roomServiceIds) ? form.roomServiceIds : [])
                      .map(String)
                      .includes(String(service.id));
                    return (
                      <label key={`room-amenity-${service.id}`}>
                        <span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => updateRoomAmenities(service.id, e.target.checked)}
                          />
                          {" "}
                          {service.name}
                        </span>
                        <small>{service.description || "Bez popisu"}</small>
                      </label>
                    );
                  })}
                </div>
              )}
            </fieldset>

            {roomId && (
              <label className="room-active-toggle reservation-form-grid__full">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => handleInputChange("active", e.target.checked)}
                />
                <span>Pokoj je aktivní</span>
              </label>
            )}
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
            <button className="btn btn--primary" type="button" disabled={isPending} onClick={handleSubmit}>
              {form?.id ? "Uložit pokoj" : "Vytvořit pokoj"}
            </button>
          </div>
        </>
      )}
    </BaseModal>
  ), document.body);
}