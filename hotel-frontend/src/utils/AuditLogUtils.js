export function formatDateTime(value) {
  if (!value) return "-";

  return new Date(value).toLocaleString("cs-CZ", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export const DEFAULT_AUDIT_LOG_FILTERS = {
  employee: "ALL",
  field: "ALL",
  fromDate: "",
  toDate: "",
};

export function getAuditLogEmployee(log) {
  return log.employee?.username ?? log.employee?.name ?? "";
}

export function getAuditLogEmployees(logs = []) {
  return Array.from(
    new Set(logs.map(getAuditLogEmployee).filter(Boolean))
  );
}

export function getAuditLogFields(logs = []) {
  return Array.from(
    new Set(logs.map((log) => log.fieldName).filter(Boolean))
  );
}

export function filterAuditLogs(logs = [], filters = DEFAULT_AUDIT_LOG_FILTERS) {
  return logs.filter((log) => {
    const employee = getAuditLogEmployee(log);
    const field = log.fieldName ?? "";
    const changeDate = log.changeDate ? new Date(log.changeDate) : null;

    if (filters.employee !== "ALL" && employee !== filters.employee) {
      return false;
    }

    if (filters.field !== "ALL" && field !== filters.field) {
      return false;
    }

    if (filters.fromDate && (!changeDate || changeDate < new Date(`${filters.fromDate}T00:00:00`))) {
      return false;
    }

    if (filters.toDate && (!changeDate || changeDate > new Date(`${filters.toDate}T23:59:59`))) {
      return false;
    }

    return true;
  });
}
