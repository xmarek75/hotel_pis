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

const createReservation = async ({authHeader, payload}) => {
  const url = `${API_BASE}/reservations`;
  
  const res = await fetch(url, {
    method: "POST",
    headers: { 
      Authorization: authHeader, 
      "Content-Type": "application/json",
      Accept: "application/json" 
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.text().catch(() => ({}));
    throw new Error(errorData || `Vytvoření se nezdařilo (${res.status})`);
  }

  return res.json();
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

const editReservationStatus = async ({ authHeader, id, status }) => {
  const url = `${API_BASE}/reservations/${id}`;
  
  const res = await fetch(url, {
    method: "PUT",
    headers: { 
      Authorization: authHeader, 
      "Content-Type": "application/json",
      Accept: "application/json" 
    },
    body: JSON.stringify({status})
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

export const useCreateReservation = () => {
  const { authHeader } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => createReservation({ authHeader, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
  });
};

export const useEditReservation = () => {
  const { authHeader } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => editReservation({ authHeader, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["reservation-payment-summary"] });

    },
  });
};

export const useEditReservationStatus = () => {
  const { authHeader } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({id, status}) => editReservationStatus({ authHeader, id, status }),
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