import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";

const API_BASE = import.meta.env.DEV ? "/api" : "/hotel/api";

const getReservationAuditLogs = async (authHeader) => {
  const res = await fetch(`${API_BASE}/audit-logs/reservations`, {
    headers: {
      Authorization: authHeader,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(errorText || `Nepodařilo se načíst historii změn (${res.status}).`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : [];
};

export const useReservationAuditLogs = () => {
  const { authHeader } = useAuth();

  return useQuery({
    queryKey: ["reservation-audit-logs"],
    queryFn: () => getReservationAuditLogs(authHeader),
    enabled: !!authHeader,
  });
};
