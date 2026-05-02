import React from "react";

export default function CustomersSection({
  canManageCustomers,
  openCreateCustomer,
  loading,
  error,
  customerStatus,
  customers,
  formatDate,
  calculateAgeFromDate,
  openEditCustomer,
  deleteCustomer,
}) {
  return (
    <section className="panel panel--wide">
      <section className="rooms-admin rooms-admin--standalone">
        <div className="rooms-admin__head">
          <h3>Správa zákazníků</h3>
          {canManageCustomers ? (
            <button className="btn btn--primary btn--compact" type="button" onClick={openCreateCustomer}>
              Přidat zákazníka
            </button>
          ) : (
            <span className="rooms-admin__note">Správu zákazníků má dostupnou admin nebo recepce.</span>
          )}
        </div>

        {loading ? <p className="panel__text">Načítám zákazníky...</p> : null}
        {error ? <p className="status status--error">{error}</p> : null}
        {customerStatus.message ? (
          <p className={`status status--${customerStatus.type === "idle" ? "neutral" : customerStatus.type}`}>
            {customerStatus.message}
          </p>
        ) : null}

        {!loading && !error ? (
          <div className="rooms-admin__table-wrap">
            <table className="rooms-admin__table">
              <thead>
                <tr>
                  <th>Jméno</th>
                  <th>Datum narození</th>
                  <th>Věk</th>
                  <th>E-mail</th>
                  <th>Telefon</th>
                  <th aria-label="Akce" />
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={6}>{canManageCustomers ? "Žádní zákazníci." : "Nedostupné."}</td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr key={`manage-customer-${customer.id}`}>
                      <td>{customer.name ?? "-"}</td>
                      <td>{formatDate(customer.dateOfBirth)}</td>
                      <td>{calculateAgeFromDate(customer.dateOfBirth) ?? "-"}</td>
                      <td>{customer.email ?? "-"}</td>
                      <td>{customer.phone ?? "-"}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="btn btn--secondary btn--compact"
                            type="button"
                            disabled={!canManageCustomers}
                            onClick={() => openEditCustomer(customer)}
                          >
                            Upravit
                          </button>
                          <button
                            className="btn btn--danger btn--compact"
                            type="button"
                            disabled={!canManageCustomers}
                            onClick={() => deleteCustomer(customer)}
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
