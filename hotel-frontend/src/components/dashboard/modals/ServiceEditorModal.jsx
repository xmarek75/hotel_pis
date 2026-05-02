import React from "react";

export default function ServiceEditorModal({
  serviceEditor,
  serviceForm,
  serviceStatus,
  updateServiceForm,
  closeServiceEditor,
  submitServiceEditor,
}) {
  if (!serviceEditor) return null;

  return (
    <div className="reservation-modal-backdrop" onClick={closeServiceEditor}>
      <section className="reservation-modal" onClick={(e) => e.stopPropagation()} aria-label="Správa služby">
        <header className="reservation-modal__head">
          <h3>{serviceEditor.mode === "create" ? "Přidat službu" : "Upravit službu"}</h3>
          <button className="btn btn--secondary btn--compact" type="button" onClick={closeServiceEditor}>
            Zavřít
          </button>
        </header>

        <div className="reservation-form-grid">
          <label>
            <span>Název služby</span>
            <input value={serviceForm.name} onChange={(e) => updateServiceForm("name", e.target.value)} />
          </label>
          <label>
            <span>Cena</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={serviceForm.price}
              onChange={(e) => updateServiceForm("price", e.target.value)}
            />
          </label>
          <label className="reservation-form-grid__full">
            <span>Popis</span>
            <textarea
              rows={3}
              value={serviceForm.description}
              onChange={(e) => updateServiceForm("description", e.target.value)}
            />
          </label>
        </div>

        {serviceStatus.message ? (
          <p className={`status status--${serviceStatus.type === "idle" ? "neutral" : serviceStatus.type}`}>
            {serviceStatus.message}
          </p>
        ) : null}

        <div className="reservation-actions">
          <button className="btn btn--secondary" type="button" onClick={closeServiceEditor}>
            Zrušit
          </button>
          <button className="btn btn--primary" type="button" onClick={submitServiceEditor}>
            Uložit službu
          </button>
        </div>
      </section>
    </div>
  );
}
