import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import ServiceModal from "../components/modals/ServiceModal";
import RoomAmenityModal from "../components/modals/RoomAmenityModal";
import CustomerModal from "../components/modals/CustomerModal";
import { useDeleteEmployee, useEmployees } from "../queries/useEmployees";
import EmployeeModal from "../components/modals/EmployeeModal";

export default function EmployeePage() {
  const { role } = useAuth();

  const { data: employees, isLoading: EIsLoading, error: employeeError } = useEmployees();
  const { mutate: deleteEmployee, isPending: isDeleteEmployeePending, error: deleteEmployeeError } = useDeleteEmployee();
  
  const [activeModal, setActiveModal] = useState({ type: null, data: null });
  
  const openModal = (type, data = null) => setActiveModal({ type, data });
  const closeModal = () => setActiveModal({ type: null, data: null });

  const canManageEmployees = useMemo(() => role.toUpperCase() === "ADMINISTRATOR", [role]);

  return (
    <section className="panel panel--wide">
      <section className="rooms-admin rooms-admin--standalone">
        <div className="rooms-admin__head">
          <h3>Správa zaměstnanců</h3>
          {canManageEmployees ? (
            <button className="btn btn--primary btn--compact" type="button" onClick={() => openModal("EMPLOYEE")}>
              Přidat zaměstnance
            </button>
          ) : (
            <span className="rooms-admin__note">Zobrazení zaměstnanců je dostupné jen pro admin účet.</span>
          )}
        </div>

        {EIsLoading && <p className="panel__text">Načítám zaměstnance...</p>}
        {employeeError && <p className="status status--error">{employeeError.message}</p>}
        {deleteEmployeeError && <p className="status status--error">{deleteEmployeeError.message}</p>}

        {(!EIsLoading && !employeeError && employees) && (
          <div className="rooms-admin__table-wrap">
            <table className="rooms-admin__table">
              <thead>
                <tr>
                  <th>Jméno</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Kontakt</th>
                  <th>Stav</th>
                  <th aria-label="Akce" />
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={6}>{canManageEmployees ? "Žádní zaměstnanci." : "Nedostupné."}</td>
                  </tr>
                ) : (
                  employees.map((employee) => (
                    <tr key={`manage-emp-${employee.id}`}>
                      <td>{employee.name ?? "-"}</td>
                      <td>{employee.username ?? "-"}</td>
                      <td>{employee.role ?? "-"}</td>
                      <td>{employee.contact ?? "-"}</td>
                      <td>{employee.active === false ? "Neaktivní" : "Aktivní"}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="btn btn--secondary btn--compact"
                            type="button"
                            disabled={!canManageEmployees}
                            onClick={() => openModal("EMPLOYEE", employee)}
                          >
                            Upravit
                          </button>
                          <button
                            className="btn btn--danger btn--compact"
                            type="button"
                            disabled={!canManageEmployees || isDeleteEmployeePending}
                            onClick={() => deleteEmployee(employee.id)}
                          >
                            Smazat
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeModal.type === 'EMPLOYEE' && (
          <EmployeeModal
            key={activeModal.data?.id || 'new-employee'}
            onClose={closeModal}
            employeeId={activeModal.data?.id}
          />
        )}
      </section>
    </section>
  );
}