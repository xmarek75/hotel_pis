import React from "react";

export default function CustomerEditorModal({
  customerEditor,
  customerForm,
  customerStatus,
  closeCustomerEditor,
  updateCustomerForm,
  submitCustomerEditor,
}) {
  if (!customerEditor) return null;

  return (
    <div className="reservation-modal-backdrop" onClick={closeCustomerEditor}>
      <section className="reservation-modal" onClick={(e) => e.stopPropagation()} aria-label="Správa zákazníka">
        <header className="reservation-modal__head">
          <h3>{customerEditor.mode === "create" ? "Přidat zákazníka" : "Upravit zákazníka"}</h3>
          <button className="btn btn--secondary btn--compact" type="button" onClick={closeCustomerEditor}>
            Zavřít
          </button>
        </header>

        <div className="reservation-form-grid">
          <label>
            <span>Jméno</span>
            <input value={customerForm.name} onChange={(e) => updateCustomerForm("name", e.target.value)} />
          </label>
          <label>
            <span>Datum narození</span>
            <input
              type="date"
              value={customerForm.dateOfBirth}
              onChange={(e) => updateCustomerForm("dateOfBirth", e.target.value)}
            />
          </label>
          <label>
            <span>E-mail</span>
            <input
              type="email"
              value={customerForm.email}
              onChange={(e) => updateCustomerForm("email", e.target.value)}
            />
          </label>
          <label>
            <span>Telefon</span>
            <input value={customerForm.phone} onChange={(e) => updateCustomerForm("phone", e.target.value)} />
          </label>
        </div>

        {customerStatus.message ? (
          <p className={`status status--${customerStatus.type === "idle" ? "neutral" : customerStatus.type}`}>
            {customerStatus.message}
          </p>
        ) : null}

        <div className="reservation-actions">
          <button className="btn btn--secondary" type="button" onClick={closeCustomerEditor}>
            Zrušit
          </button>
          <button className="btn btn--primary" type="button" onClick={submitCustomerEditor}>
            Uložit zákazníka
          </button>
        </div>
      </section>
    </div>
  );
}
