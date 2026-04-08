import React from "react";

export default function EmployeesSection({
  canManageEmployees,
  openCreateEmployee,
  loading,
  error,
  employeeStatus,
  employees,
  openEditEmployee,
  deleteEmployee,
}) {
  return (
    <section className="panel panel--wide">
      <section className="rooms-admin rooms-admin--standalone">
        <div className="rooms-admin__head">
          <h3>Správa zaměstnanců</h3>
          {canManageEmployees ? (
            <button className="btn btn--primary btn--compact" type="button" onClick={openCreateEmployee}>
              Přidat zaměstnance
            </button>
          ) : (
            <span className="rooms-admin__note">Zobrazení zaměstnanců je dostupné jen pro admin účet.</span>
          )}
        </div>

        {loading ? <p className="panel__text">Načítám zaměstnance...</p> : null}
        {error ? <p className="status status--error">{error}</p> : null}
        {employeeStatus.message ? (
          <p className={`status status--${employeeStatus.type === "idle" ? "neutral" : employeeStatus.type}`}>
            {employeeStatus.message}
          </p>
        ) : null}

        {!loading && !error ? (
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
                            onClick={() => openEditEmployee(employee)}
                          >
                            Upravit
                          </button>
                          <button
                            className="btn btn--danger btn--compact"
                            type="button"
                            disabled={!canManageEmployees}
                            onClick={() => deleteEmployee(employee)}
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
        ) : null}
      </section>
    </section>
  );
}
