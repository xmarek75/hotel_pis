import React from "react";

export default function RoomAmenityEditorModal({
  roomAmenityEditor,
  roomAmenityForm,
  roomAmenityStatus,
  updateRoomAmenityForm,
  closeRoomAmenityEditor,
  submitRoomAmenityEditor,
}) {
  if (!roomAmenityEditor) return null;

  return (
    <div className="reservation-modal-backdrop" onClick={closeRoomAmenityEditor}>
      <section className="reservation-modal" onClick={(e) => e.stopPropagation()} aria-label="Správa room service">
        <header className="reservation-modal__head">
          <h3>{roomAmenityEditor.mode === "create" ? "Přidat room service" : "Upravit room service"}</h3>
          <button className="btn btn--secondary btn--compact" type="button" onClick={closeRoomAmenityEditor}>
            Zavřít
          </button>
        </header>

        <div className="reservation-form-grid">
          <label>
            <span>Název room service</span>
            <input value={roomAmenityForm.name} onChange={(e) => updateRoomAmenityForm("name", e.target.value)} />
          </label>
          <label className="reservation-form-grid__full">
            <span>Popis</span>
            <textarea
              rows={3}
              value={roomAmenityForm.description}
              onChange={(e) => updateRoomAmenityForm("description", e.target.value)}
            />
          </label>
        </div>

        {roomAmenityStatus.message ? (
          <p className={`status status--${roomAmenityStatus.type === "idle" ? "neutral" : roomAmenityStatus.type}`}>
            {roomAmenityStatus.message}
          </p>
        ) : null}

        <div className="reservation-actions">
          <button className="btn btn--secondary" type="button" onClick={closeRoomAmenityEditor}>
            Zrušit
          </button>
          <button className="btn btn--primary" type="button" onClick={submitRoomAmenityEditor}>
            Uložit room service
          </button>
        </div>
      </section>
    </div>
  );
}
