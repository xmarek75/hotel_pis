import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";

const API_BASE = import.meta.env.DEV ? "/api" : "/hotel/api";

const createPayment = async ({ authHeader, payload }) => {
  const res = await fetch(`${API_BASE}/payments`, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(errorText || `Vytvoření platby selhalo (${res.status})`);
  }

  return res.json();
};

const getReservationPaymentSummary = async ({ authHeader, reservationId }) => {
  const res = await fetch(`${API_BASE}/reservations/${reservationId}/payment-summary`, {
    headers: {
      Authorization: authHeader,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Načtení souhrnu plateb selhalo (${res.status})`);
  }

  return res.json();
};

export const useCreatePayment = () => {
  const { authHeader } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => createPayment({ authHeader, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["reservation-payment-summary"] });
    },
  });
};

export const useReservationPaymentSummary = (reservationId) => {
  const { authHeader } = useAuth();

  return useQuery({
    queryKey: ["reservation-payment-summary", reservationId],
    queryFn: () => getReservationPaymentSummary({ authHeader, reservationId }),
    enabled: !!authHeader && !!reservationId,
  });
};

