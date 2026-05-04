import { usePayments,useDeletePayment } from "../queries/usePayment";
import { formatMoney, formatDateTime } from "../utils/dashboardUtils";

import { useAuth } from "../auth/AuthContext";

export default function PaymentPage() {
    const { role } = useAuth();
    const { mutate: deletePayment, isPending: deleteIsPending, error: deleteError } = useDeletePayment();

    const canRefundPayments = ["ADMINISTRATOR", "MANAGER"].includes(role?.toUpperCase());
    const { data: payments, isLoading, error } = usePayments();

    const handleDeletePayment = (payment) => {
        const confirmed = window.confirm(
            `Opravdu chcete vrátit platbu #${payment.id} ve výši ${formatMoney(payment.amount)}?`
        );

        if (!confirmed) {
            return;
        }

        deletePayment(payment.id);
        };

    return (
        <section className="panel panel--wide">
        <section className="rooms-admin rooms-admin--standalone">
            <div className="rooms-admin__head">
            <h3>Správa plateb</h3>
            </div>

            {isLoading && <p className="panel__text">Načítám platby...</p>}
            {error && <p className="status status--error">{error.message}</p>}
            {deleteError && <p className="status status--error">{deleteError.message}</p>}


            {!isLoading && !error && payments && (
            <div className="rooms-admin__table-wrap">
                <table className="rooms-admin__table">
                <thead>
                    <tr>
                    <th>ID</th>
                    <th>Datum</th>
                    <th>Částka</th>
                    <th>Metoda</th>
                    <th>Rezervace</th>
                    <th>Zadal</th>
                    <th>Vrátit platbu</th>
                    </tr>
                </thead>
                <tbody>
                    {payments.length === 0 ? (
                    <tr>
                        <td colSpan={7}>Žádné platby.</td>
                    </tr>
                    ) : (
                    payments.map((payment) => (
                        <tr key={`payment-${payment.id}`}>
                        <td>{payment.id}</td>
                        <td>{formatDateTime(payment.paymentDate)}</td>
                        <td>{formatMoney(payment.amount)}</td>
                        <td>{payment.method ?? "-"}</td>
                        <td>{payment.reservation?.id ?? "-"}</td>
                        <td>{payment.employee?.name ?? payment.employee?.username ?? "-"}</td>
                        <td>
                            {canRefundPayments ? (
                                <button
                                className="btn btn--danger btn--compact"
                                type="button"
                                disabled={deleteIsPending}
                                onClick={() => handleDeletePayment(payment)}
                                >
                                Vrátit platbu
                                </button>
                            ) : (
                                "-"
                            )}
                            </td>
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
