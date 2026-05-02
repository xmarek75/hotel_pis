import React from "react";

export default function EmployeeEditorModal({
  employeeEditor,
  employeeForm,
  employeeStatus,
  closeEmployeeEditor,
  updateEmployeeForm,
  EMPLOYEE_ROLES,
  openEmployeePasswordEditor,
  submitEmployeeEditor,
}) {
  if (!employeeEditor) return null;

  return (
    <div className="reservation-modal-backdrop" onClick={closeEmployeeEditor}>
      <section className="reservation-modal" onClick={(e) => e.stopPropagation()} aria-label="Správa zaměstnance">
        <header className="reservation-modal__head">
          <h3>{employeeEditor.mode === "create" ? "Přidat zaměstnance" : "Upravit zaměstnance"}</h3>
          <button className="btn btn--secondary btn--compact" type="button" onClick={closeEmployeeEditor}>
            Zavřít
          </button>
        </header>

        <div className="reservation-form-grid">
          <label>
            <span>Jméno</span>
            <input value={employeeForm.name} onChange={(e) => updateEmployeeForm("name", e.target.value)} />
          </label>
          <label>
            <span>Username</span>
            <input value={employeeForm.username} onChange={(e) => updateEmployeeForm("username", e.target.value)} />
          </label>
          <label>
            <span>Kontakt</span>
            <input value={employeeForm.contact} onChange={(e) => updateEmployeeForm("contact", e.target.value)} />
          </label>
          <label>
            <span>Role</span>
            <select value={employeeForm.role} onChange={(e) => updateEmployeeForm("role", e.target.value)}>
              {EMPLOYEE_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
          {employeeEditor.mode === "create" ? (
            <>
              <label>
                <span>Heslo</span>
                <input
                  type="password"
                  value={employeeForm.password}
                  autoComplete="new-password"
                  onChange={(e) => updateEmployeeForm("password", e.target.value)}
                />
              </label>
              <label>
                <span>Potvrzení hesla</span>
                <input
                  type="password"
                  value={employeeForm.passwordConfirm}
                  autoComplete="new-password"
                  onChange={(e) => updateEmployeeForm("passwordConfirm", e.target.value)}
                />
              </label>
            </>
          ) : null}
        </div>

        {employeeStatus.message ? (
          <p className={`status status--${employeeStatus.type === "idle" ? "neutral" : employeeStatus.type}`}>
            {employeeStatus.message}
          </p>
        ) : null}

        <div className="reservation-actions">
          {employeeEditor.mode === "edit" ? (
            <button className="btn btn--secondary" type="button" onClick={openEmployeePasswordEditor}>
              Změnit heslo
            </button>
          ) : null}
          <button className="btn btn--primary" type="button" onClick={submitEmployeeEditor}>
            Uložit zaměstnance
          </button>
        </div>
      </section>
    </div>
  );
}
