import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";

const API_BASE = import.meta.env.DEV ? "/api" : "/hotel/api";

const getReservations = async (authHeader) => {
  const res = await fetch(`${API_BASE}/reservations`, { 
    headers: { Authorization: authHeader, Accept: "application/json" } 
  });
  if (!res.ok) throw new Error(`Načtení rezervací selhalo (${res.status})`);
  const data = await res.json();

  return data ? data : [];
};

const editReservation = async ({ authHeader, payload }) => {
  const url = `${API_BASE}/reservations/${payload.id}`;
  
  const res = await fetch(url, {
    method: "PUT",
    headers: { 
      Authorization: authHeader, 
      "Content-Type": "application/json",
      Accept: "application/json" 
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.text().catch(() => ({}));
    throw new Error(errorData || `Uložení se nezdařilo (${res.status})`);
  }

  return res.json();
};

const editReservationStatus = async ({ authHeader, id, status, paymentStatus }) => {
  const url = `${API_BASE}/reservations/${id}`;
  
  const res = await fetch(url, {
    method: "PUT",
    headers: { 
      Authorization: authHeader, 
      "Content-Type": "application/json",
      Accept: "application/json" 
    },
    body: JSON.stringify({status, paymentStatus})
  });

  if (!res.ok) {
    const errorData = await res.text().catch(() => ({}));
    throw new Error(errorData || `Uložení se nezdařilo (${res.status})`);
  }

  return res.json();
};

const deleteReservation = async ({ authHeader, id }) => {
  const res = await fetch(`${API_BASE}/reservations/${id}`, {
    method: "DELETE",
    headers: { 
      Authorization: authHeader,
      Accept: "application/json" 
    },
  });

  if (!res.ok) {
    const errorData = await res.text().catch(() => ({}));
    throw new Error(errorData || `Smazání zaměstnance selhalo (${res.status})`);
  }

  return true;
};

export const useReservations = (options = {}) => {
  const { authHeader } = useAuth();

  return useQuery({
    queryKey: ["reservations"],
    queryFn: () => getReservations(authHeader),
    enabled: !!authHeader,
    ...options,
  });
};

export const useEditReservation = () => {
  const { authHeader } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => editReservation({ authHeader, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
  });
};

export const useEditReservationStatus = () => {
  const { authHeader } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({id, status, paymentStatus}) => editReservationStatus({ authHeader, id, status, paymentStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
  });
};

export const useDeleteReservation = () => {
  const { authHeader } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => deleteReservation({ authHeader, id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
  });
};