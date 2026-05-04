import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { calculateAgeFromDate, formatDate } from "../utils/dashboardUtils";
import ServiceModal from "../components/modals/ServiceModal";
import RoomAmenityModal from "../components/modals/RoomAmenityModal";
import { useCustomers, useDeleteCustomer } from "../queries/useCustomers";
import CustomerModal from "../components/modals/CustomerModal";

export default function CustomerPage() {
  const { role } = useAuth();

  const { data: customers, isLoading: CIsLoading, error: customerError } = useCustomers();
  const { mutate: deleteCustomer, isPending: isDeleteCustomerPending, error: deleteCustomerError } = useDeleteCustomer();
  
  const [activeModal, setActiveModal] = useState({ type: null, data: null });
  
  const openModal = (type, data = null) => setActiveModal({ type, data });
  const closeModal = () => setActiveModal({ type: null, data: null });

  const canManageCustomers = useMemo(() => role.toUpperCase() === "ADMINISTRATOR", [role]);

  return (
    <section className="panel panel--wide">
      <section className="rooms-admin rooms-admin--standalone">
        <div className="rooms-admin__head">
          <h3>Správa zákazníků</h3>
          {canManageCustomers ? (
            <button className="btn btn--primary btn--compact" type="button" onClick={() => openModal("CUSTOMER")}>
              Přidat zákazníka
            </button>
          ) : (
            <span className="rooms-admin__note">Správu zákazníků má dostupnou admin nebo recepce.</span>
          )}
        </div>

        {CIsLoading && <p className="panel__text">Načítám zákazníky...</p>}
        {customerError && <p className="status status--error">{customerError.message}</p>}
        {deleteCustomerError && <p className="status status--error">{deleteCustomerError.message}</p>}

        {(!CIsLoading && !customerError && customers) && (
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
                            onClick={() => openModal("CUSTOMER", customer)}
                          >
                            Upravit
                          </button>
                          <button
                            className="btn btn--danger btn--compact"
                            type="button"
                            disabled={!canManageCustomers || isDeleteCustomerPending}
                            onClick={() => deleteCustomer(customer.id)}
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

        {activeModal.type === 'CUSTOMER' && (
          <CustomerModal 
            key={activeModal.data?.id || 'new-customer'}
            onClose={closeModal}
            customerId={activeModal.data?.id}
          />
        )}
      </section>
    </section>
  );
}