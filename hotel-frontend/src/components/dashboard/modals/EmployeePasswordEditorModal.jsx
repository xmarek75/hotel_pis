import React from "react";

export default function EmployeePasswordEditorModal({
  employeePasswordEditor,
  employeePasswordForm,
  employeePasswordStatus,
  closeEmployeePasswordEditor,
  updateEmployeePasswordForm,
  submitEmployeePasswordChange,
}) {
  if (!employeePasswordEditor) return null;

  return (
    <div className="reservation-modal-backdrop" onClick={closeEmployeePasswordEditor}>
      <section className="reservation-modal" onClick={(e) => e.stopPropagation()} aria-label="Změna hesla zaměstnance">
        <header className="reservation-modal__head">
          <h3>Změnit heslo: {employeePasswordEditor.username || `#${employeePasswordEditor.employeeId}`}</h3>
          <button className="btn btn--secondary btn--compact" type="button" onClick={closeEmployeePasswordEditor}>
            Zavřít
          </button>
        </header>

        <div className="reservation-form-grid">
          <label>
            <span>Nové heslo</span>
            <input
              type="password"
              value={employeePasswordForm.password}
              autoComplete="new-password"
              onChange={(e) => updateEmployeePasswordForm("password", e.target.value)}
            />
          </label>
          <label>
            <span>Potvrzení nového hesla</span>
            <input
              type="password"
              value={employeePasswordForm.passwordConfirm}
              autoComplete="new-password"
              onChange={(e) => updateEmployeePasswordForm("passwordConfirm", e.target.value)}
            />
          </label>
        </div>

        {employeePasswordStatus.message ? (
          <p
            className={`status status--${employeePasswordStatus.type === "idle" ? "neutral" : employeePasswordStatus.type}`}
          >
            {employeePasswordStatus.message}
          </p>
        ) : null}

        <div className="reservation-actions">
          <button className="btn btn--primary" type="button" onClick={submitEmployeePasswordChange}>
            Uložit nové heslo
          </button>
        </div>
      </section>
    </div>
  );
}
