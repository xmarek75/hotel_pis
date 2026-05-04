import { useState } from "react";
import BaseModal from "./BaseModal";
import { createPortal } from "react-dom";
import { useEmployees, useUpsertEmployee, useDeleteEmployee } from "../../queries/useEmployees";
import { EMPLOYEE_ROLES } from "../../utils/dashboardConstants";

export default function EmployeeModal({ employeeId, onClose }) {
  const { data: employee, isLoading } = useEmployees({
    select: (employees) => employees.find((e) => e.id === employeeId),
  });

  const {
    mutate,
    isPending,
    error: mutationError,
  } = useUpsertEmployee();
  
  const {
    mutate: toggleEmployeeActive,
    isPending: activeIsPending,
    error: activeMutationError,
  } = useUpsertEmployee();

  const {
    mutate: deactivateEmployee,
    isPending: deactivateIsPending,
    error: deactivateMutationError,
  } = useDeleteEmployee();

  const [changePassword, setChangePassword] = useState(!employeeId);

  const [form, setForm] = useState({
    id: employee?.id ?? "",
    name: employee?.name ?? "",
    username: employee?.username ?? "",
    contact: employee?.contact ?? "",
    role: employee?.role ?? "RECEPTIONIST",
    active: employee?.active ?? true,
    password: "",
    passwordConfirm: ""
  });
  
  const [successMessage, setSuccessMessage] = useState("");
  const [validationError, setValidationError] = useState("");

  const passwordsMatch = form.password === form.passwordConfirm;
  const showPasswordError = changePassword && form.passwordConfirm.length > 0 && !passwordsMatch;

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
      setValidationError("Jméno nesmí být prázdné.");
      return;
    }

    if (!form.username.trim()) {
      setValidationError("Uživatelské jméno nesmí být prázdné.");
      return;
    }

    if (changePassword && !passwordsMatch) {
      setValidationError("Hesla se neshodují.");
      return;
    }

    if (changePassword && !form.password && !employeeId) {
      setValidationError("Heslo nesmí být prázdné.");
      return;
    }

    const payload = {
      id: employeeId || form.id,
      name: form.name,
      username: form.username,
      contact: form.contact,
      role: form.role,
      ...(changePassword && { password: form.password })
    };

    mutate(payload, {
      onSuccess: (data) => {
        const msg = form?.id ? "Zaměstnanec byl úspěšně uložen." : "Zaměstnanec byl úspěšně vytvořen.";
        setSuccessMessage(msg);
        
        if (!employeeId && data?.id) {
          updateForm("id", data.id);
        }
      }
    });
  };
  const handleToggleActive = () => {
    setValidationError("");
    setSuccessMessage("");

    if (!employeeId) return;

    if (employee?.active) {
      deactivateEmployee(employeeId, {
        onSuccess: () => {
          updateForm("active", false);
          setSuccessMessage("Zaměstnanec byl deaktivován.");
        },
      });
      return;
    }

    toggleEmployeeActive(
      {
        id: employeeId,
        name: employee.name,
        username: employee.username,
        contact: employee.contact,
        role: employee.role,
        active: true,
      },
      {
        onSuccess: () => {
          updateForm("active", true);
          setSuccessMessage("Zaměstnanec byl aktivován.");
        },
      }
    );
  };

  const inputErrorStyle = { borderColor: "red" };

  return createPortal((
    <BaseModal title={employeeId ? "Upravit zaměstnance" : "Přidat zaměstnance"} onClose={onClose}>
      {isLoading ? (
        <p>Načítání...</p>
      ) : (
        <>
          <div className="reservation-form-grid">
            <label>
              <span>Jméno</span>
              <input 
                placeholder="Zadejte celé jméno" 
                value={form.name} 
                onChange={(e) => handleInputChange("name", e.target.value)} 
              />
            </label>
            <label>
              <span>Uživatelské jméno</span>
              <input 
                placeholder="Zadejte uživatelské jméno" 
                value={form.username} 
                onChange={(e) => handleInputChange("username", e.target.value)} 
              />
            </label>
            <label>
              <span>Kontakt (telefon)</span>
              <input 
                placeholder="+420..." 
                value={form.contact} 
                onChange={(e) => handleInputChange("contact", e.target.value)} 
              />
            </label>
            <label>
              <span>Role</span>
              <select value={form.role} onChange={(e) => handleInputChange("role", e.target.value)}>
                {EMPLOYEE_ROLES.map((role) => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </label>

            <div style={{ gridColumn: "span 2" }}>
              {employeeId && (
                <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <input
                    type="checkbox"
                    checked={changePassword}
                    onChange={() => {
                      setChangePassword(prev => !prev);
                      setSuccessMessage("");
                      setValidationError("");
                    }}
                  />
                  <span>Změnit heslo</span>
                </label>
              )}

              {changePassword && (
                <div className="reservation-form-grid" style={{ marginTop: employeeId ? "10px" : "0" }}>
                  <label>
                    <span>Heslo</span>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={form.password}
                      autoComplete="new-password"
                      style={showPasswordError ? inputErrorStyle : {}}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                    />
                  </label>
                  <label>
                    <span>Potvrzení hesla</span>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={form.passwordConfirm}
                      autoComplete="new-password"
                      style={showPasswordError ? inputErrorStyle : {}}
                      onChange={(e) => handleInputChange("passwordConfirm", e.target.value)}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {(mutationError || activeMutationError || deactivateMutationError || validationError || showPasswordError) && (
            <p className="status status--error">
              {validationError
                || mutationError?.message
                || activeMutationError?.message
                || deactivateMutationError?.message
                || (showPasswordError && "Hesla se neshodují")}
            </p>
          )}

          {successMessage && (
            <p className="status status--success">{successMessage}</p>
          )}

          <div className="reservation-actions">
            <button className="btn btn--secondary" type="button" onClick={onClose}>
              Zrušit
            </button>
            {employeeId && (
              <button
                className={employee?.active ? "btn btn--danger" : "btn btn--secondary"}
                type="button"
                disabled={activeIsPending || deactivateIsPending}
                onClick={handleToggleActive}
              >
                {employee?.active ? "Deaktivovat" : "Aktivovat"}
              </button>
            )}
            <button 
              className="btn btn--primary" 
              type="button" 
              disabled={isPending} 
              onClick={handleSubmit}
            >
              {form?.id ? "Uložit zaměstnance" : "Vytvořit zaměstnance"}
            </button>
          </div>
        </>
      )}
    </BaseModal>
  ), document.body);
}