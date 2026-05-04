import { useMemo, useState } from "react";
import { useReservationAuditLogs } from "../queries/useAuditLogs";
import { formatDateTime } from "../utils/dashboardUtils";
import {
  DEFAULT_AUDIT_LOG_FILTERS,
  filterAuditLogs,
  getAuditLogEmployees,
  getAuditLogFields,
} from "../utils/AuditLogUtils";

export default function AuditLogPage() {
  const { data: logs, isLoading, error } = useReservationAuditLogs();

  const [filters, setFilters] = useState(DEFAULT_AUDIT_LOG_FILTERS);

  const employees = useMemo(() => getAuditLogEmployees(logs), [logs]);
  const fields = useMemo(() => getAuditLogFields(logs), [logs]);
  const filteredLogs = useMemo(() => filterAuditLogs(logs, filters), [logs, filters]);

  function updateFilter(field, value) {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }

  function resetFilters() {
    setFilters(DEFAULT_AUDIT_LOG_FILTERS);
  }

  return (
    <section className="panel panel--wide">
      <section className="rooms-admin rooms-admin--standalone">
        <div className="rooms-admin__head">
          <h3>Historie změn rezervací</h3>
          <span className="rooms-admin__note">
            Auditní záznamy změn provedených v rezervacích.
          </span>
        </div>

        {isLoading && <p className="panel__text">Načítám historii změn...</p>}
        {error && <p className="status status--error">{error.message}</p>}

        {!isLoading && !error && logs && (
          <>
            <div className="reservation-filters">
              <div className="reservation-filters__grid">
                <label>
                  <span>Zaměstnanec</span>
                  <select
                    value={filters.employee}
                    onChange={(e) => updateFilter("employee", e.target.value)}
                  >
                    <option value="ALL">Všichni</option>
                    {employees.map((employee) => (
                      <option key={employee} value={employee}>
                        {employee}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Změněné pole</span>
                  <select
                    value={filters.field}
                    onChange={(e) => updateFilter("field", e.target.value)}
                  >
                    <option value="ALL">Všechna</option>
                    {fields.map((field) => (
                      <option key={field} value={field}>
                        {field}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Od</span>
                  <input
                    type="date"
                    value={filters.fromDate}
                    onChange={(e) => updateFilter("fromDate", e.target.value)}
                  />
                </label>

                <label>
                  <span>Do</span>
                  <input
                    type="date"
                    value={filters.toDate}
                    onChange={(e) => updateFilter("toDate", e.target.value)}
                  />
                </label>
              </div>

              <div className="reservation-filters__actions">
                <span className="rooms-admin__note">
                  Zobrazeno {filteredLogs.length} z {logs.length}.
                </span>

                <button
                  className="btn btn--secondary btn--compact"
                  type="button"
                  onClick={resetFilters}
                >
                  Reset filtru
                </button>
              </div>
            </div>

            <div className="rooms-admin__table-wrap">
              <table className="rooms-admin__table">
                <thead>
                  <tr>
                    <th>Rezervace</th>
                    <th>Zaměstnanec</th>
                    <th>Pole</th>
                    <th>Původní hodnota</th>
                    <th>Nová hodnota</th>
                    <th>Datum změny</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6}>Filtru neodpovídá žádný auditní záznam.</td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id}>
                        <td>#{log.reservation?.id ?? "-"}</td>
                        <td>{log.employee?.username ?? log.employee?.name ?? "-"}</td>
                        <td>{log.fieldName ?? "-"}</td>
                        <td>{log.oldValue ?? "-"}</td>
                        <td>{log.newValue ?? "-"}</td>
                        <td>{formatDateTime(log.changeDate)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </section>
  );
}
