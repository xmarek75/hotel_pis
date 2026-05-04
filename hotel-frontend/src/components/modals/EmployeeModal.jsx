import { useState } from "react";
import BaseModal from "./BaseModal";
import { createPortal } from "react-dom";
import { useEmployees, useUpsertEmployee } from "../../queries/useEmployees";
import { EMPLOYEE_ROLES } from "../../utils/dashboardConstants";

// FIXME: change password modal

export default function EmployeeModal({employeeId, onClose}) {
  const { data: employee, isLoading } = useEmployees({
      select: (employees) => employees.find((e) => e.id === employeeId),
    });

  const { mutate, isPending, error: mutationError } = useUpsertEmployee();

  const [form, setForm] = useState(() => {
    if (employee) {
      return {
        id: employee.id ?? "",
        name: employee.name ?? "",
        username: employee.username ?? "",
        contact: employee.contact ?? "",
        role: employee.role ?? "",
      };
    }
    return { id: "", name: "", username: "", contact: "", role: "ADMINISTRATOR", password: "", confirmPassword: "" };
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
      id: employeeId || form.id,
    };

    setSuccessMessage("");

    mutate(payload, {
      onSuccess: (data) => {
        setSuccessMessage(form?.id ? "Zaměstnanec byl úspěšně uložen." : "Zaměstnanec byl úspěšně vytvořen.");
        
        if (!employeeId && data?.id) {
          updateForm("id", data.id);
        }
      }
    });
  }

  return createPortal((
    <BaseModal title={employeeId ? "Upravit zaměstnance": "Přidat zaměstnance"} onClose={onClose}>
      {isLoading ? (
        <p>Načítání...</p>
      ) : (
        <>
          {/* employee form */}
          <div className="reservation-form-grid">
            <label>
              <span>Jméno</span>
              <input value={form.name} onChange={(e) => updateForm("name", e.target.value)} />
            </label>
            <label>
              <span>Username</span>
              <input value={form.username} onChange={(e) => updateForm("username", e.target.value)} />
            </label>
            <label>
              <span>Kontakt</span>
              <input value={form.contact} onChange={(e) => updateForm("contact", e.target.value)} />
            </label>
            <label>
              <span>Role</span>
              <select value={form.role} onChange={(e) => updateForm("role", e.target.value)}>
                {EMPLOYEE_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
            {!form?.id && (
              <>
                <label>
                  <span>Heslo</span>
                  <input
                    type="password"
                    value={form.password}
                    autoComplete="new-password"
                    onChange={(e) => updateForm("password", e.target.value)}
                  />
                </label>
                <label>
                  <span>Potvrzení hesla</span>
                  <input
                    type="password"
                    value={form.passwordConfirm}
                    autoComplete="new-password"
                    onChange={(e) => updateForm("passwordConfirm", e.target.value)}
                  />
                </label>
              </>
            )}
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
              {form?.id ? "Uložit zaměstnance" : "Vytvořit zaměstnance"}              
            </button>
          </div>
        </>
      )}
    </BaseModal>
  ), document.body);
}