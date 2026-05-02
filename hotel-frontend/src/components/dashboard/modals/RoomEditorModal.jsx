import React from "react";

export default function RoomEditorModal({
  roomEditor,
  roomForm,
  roomStatus,
  closeRoomEditor,
  updateRoomForm,
  roomTypes,
  setRoomForm,
  roomAmenities,
  toggleRoomAmenity,
  submitRoomEditor,
}) {
  if (!roomEditor) return null;

  return (
    <div className="reservation-modal-backdrop" onClick={closeRoomEditor}>
      <section className="reservation-modal" onClick={(e) => e.stopPropagation()} aria-label="Správa pokoje">
        <header className="reservation-modal__head">
          <h3>{roomEditor.mode === "create" ? "Vytvořit nový pokoj" : "Upravit pokoj"}</h3>
          <button className="btn btn--secondary btn--compact" type="button" onClick={closeRoomEditor}>
            Zavřít
          </button>
        </header>

        <div className="reservation-form-grid">
          <label>
            <span>Číslo pokoje</span>
            <input value={roomForm.number} onChange={(e) => updateRoomForm("number", e.target.value)} />
          </label>
          <label>
            <span>Typ pokoje</span>
            {roomTypes.length > 0 ? (
              <select
                value={roomForm.typeId}
                onChange={(e) => {
                  const selected = roomTypes.find((type) => String(type.id) === e.target.value);
                  setRoomForm((prev) => ({
                    ...prev,
                    typeId: e.target.value,
                    typeName: selected?.name ?? "",
                  }));
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
              <input value={roomForm.typeName} onChange={(e) => updateRoomForm("typeName", e.target.value)} />
            )}
          </label>
          <label>
            <span>Kapacita</span>
            <input
              type="number"
              min={1}
              value={roomForm.capacity}
              onChange={(e) => updateRoomForm("capacity", e.target.value)}
            />
          </label>
          <label>
            <span>Cena za noc</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={roomForm.pricePerNight}
              onChange={(e) => updateRoomForm("pricePerNight", e.target.value)}
            />
          </label>
          <fieldset className="reservation-customer-box reservation-form-grid__full">
            <legend>Vybavení pokoje</legend>
            {roomAmenities.length === 0 ? (
              <div className="customer-search-hint">Nejsou dostupné žádné room services.</div>
            ) : (
              <div className="new-customer-grid">
                {roomAmenities.map((service) => {
                  const checked = (Array.isArray(roomForm.roomServiceIds) ? roomForm.roomServiceIds : [])
                    .map(String)
                    .includes(String(service.id));
                  return (
                    <label key={`room-amenity-${service.id}`}>
                      <span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => toggleRoomAmenity(service.id, e.target.checked)}
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

          {roomEditor.mode === "edit" ? (
            <label className="room-active-toggle reservation-form-grid__full">
              <input
                type="checkbox"
                checked={roomForm.active}
                onChange={(e) => updateRoomForm("active", e.target.checked)}
              />
              <span>Pokoj je aktivní</span>
            </label>
          ) : null}
        </div>

        {roomStatus.message ? (
          <p className={`status status--${roomStatus.type === "idle" ? "neutral" : roomStatus.type}`}>
            {roomStatus.message}
          </p>
        ) : null}

        <div className="reservation-actions">
          <button className="btn btn--secondary" type="button" onClick={closeRoomEditor}>
            Zrušit
          </button>
          <button className="btn btn--primary" type="button" onClick={submitRoomEditor}>
            Uložit pokoj
          </button>
        </div>
      </section>
    </div>
  );
}
