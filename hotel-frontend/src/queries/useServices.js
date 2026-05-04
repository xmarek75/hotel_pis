import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";

const API_BASE = import.meta.env.DEV ? "/api" : "/hotel/api";

const getServices = async (authHeader) => {
  const res = await fetch(`${API_BASE}/services`, { 
    headers: { Authorization: authHeader, Accept: "application/json" } 
  });
  if (!res.ok) throw new Error(`Načtení pokojů selhalo (${res.status})`);
  const data = await res.json();

  return data ? data : [];
};

const upsertService = async ({ authHeader, payload }) => {
  const isEdit = !!payload.id;
  const url = isEdit ? `${API_BASE}/services/${payload.id}` : `${API_BASE}/services`;
  
  const res = await fetch(url, {
    method: isEdit ? "PUT" : "POST",
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

const deleteService = async ({ authHeader, id }) => {
  const res = await fetch(`${API_BASE}/services/${id}`, {
    method: "DELETE",
    headers: { 
      Authorization: authHeader,
      Accept: "application/json" 
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Smazání služby selhalo (${res.status})`);
  }

  return true;
};

export const useServices = (options = {}) => {
  const { authHeader } = useAuth();

  return useQuery({
    queryKey: ["services"],
    queryFn: () => getServices(authHeader),
    enabled: !!authHeader,
    ...options,
  });
};

export const useUpsertService = () => {
  const { authHeader } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => upsertService({ authHeader, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
};

export const useDeleteService = () => {
  const { authHeader } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => deleteService({ authHeader, id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
};