import { usePayments } from "../queries/usePayment";
import { formatMoney, formatDateTime } from "../utils/dashboardUtils";

export default function PaymentPage() {
  const { data: payments, isLoading, error } = usePayments();

  return (
    <section className="panel panel--wide">
      <section className="rooms-admin rooms-admin--standalone">
        <div className="rooms-admin__head">
          <h3>Správa plateb</h3>
        </div>

        {isLoading && <p className="panel__text">Načítám platby...</p>}
        {error && <p className="status status--error">{error.message}</p>}

        {!isLoading && !error && payments && (
          <div className="rooms-admin__table-wrap">
            <table className="rooms-admin__table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Datum</th>
                  <th>Částka</th>
                  <th>Metoda</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={4}>Žádné platby.</td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={`payment-${payment.id}`}>
                      <td>{payment.id}</td>
                      <td>{formatDateTime(payment.paymentDate)}</td>
                      <td>{formatMoney(payment.amount)}</td>
                      <td>{payment.method ?? "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
