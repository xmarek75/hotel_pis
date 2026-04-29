import React from "react";

export default function CustomersSection({
  loading,
  error,
  customers,
  formatDate,
  customerAdminSearch,
  setCustomerAdminSearch,
  openEditCustomer,
  customerStatus,
}) {
  return (
    <section className="panel panel--wide">
      <section className="rooms-admin rooms-admin--standalone">
        <div className="rooms-admin__head">
          <h3>Správa zákazníků</h3>
          <span className="rooms-admin__note">Přehled evidovaných zákazníků.</span>
        </div>

        {loading ? <p className="panel__text">Načítám zákazníky...</p> : null}
        {error ? <p className="status status--error">{error}</p> : null}
        {customerStatus?.message ? (
          <p className={`status status--${customerStatus.type === "idle" ? "neutral" : customerStatus.type}`}>
            {customerStatus.message}
          </p>
        ) : null}

        {!loading && !error ? (
          <>
            <div className="reservation-filters">
              <div className="reservation-filters__grid">
                <label>
                  <span>Hledat zákazníka</span>
                  <input
                    value={customerAdminSearch}
                    onChange={(e) => setCustomerAdminSearch(e.target.value)}
                    placeholder="Jméno, e-mail, telefon..."
                  />
                </label>
              </div>
            </div>

            <div className="rooms-admin__table-wrap">
            <table className="rooms-admin__table">
              <thead>
                <tr>
                  <th>Jméno</th>
                  <th>Datum narození</th>
                  <th>E-mail</th>
                  <th>Telefon</th>
                  <th aria-label="Akce" />
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={5}>Žádní zákazníci.</td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr key={`manage-customer-${customer.id}`}>
                      <td>{customer.name ?? "-"}</td>
                      <td>{formatDate(customer.dateOfBirth)}</td>
                      <td>{customer.email ?? "-"}</td>
                      <td>{customer.phone ?? "-"}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="btn btn--secondary btn--compact"
                            type="button"
                            onClick={() => openEditCustomer(customer)}
                          >
                            Upravit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </>
        ) : null}
      </section>
    </section>
  );
}
