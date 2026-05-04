import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";

const API_BASE = import.meta.env.DEV ? "/api" : "/hotel/api";

const getEmployees = async (authHeader) => {
  const res = await fetch(`${API_BASE}/employees`, { 
    headers: { Authorization: authHeader, Accept: "application/json" } 
  });
  if (!res.ok) throw new Error(`Načtení zaměstnanců selhalo (${res.status})`);
  const data = await res.json();

  return data ? data : [];
};

const upsertEmployee = async ({ authHeader, payload }) => {
  const isEdit = !!payload.id;
  const url = isEdit ? `${API_BASE}/employees/${payload.id}` : `${API_BASE}/employees`;
  
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

const deleteEmployee = async ({ authHeader, id }) => {
  const res = await fetch(`${API_BASE}/employees/${id}`, {
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

export const useEmployees = (options = {}) => {
  const { authHeader } = useAuth();

  return useQuery({
    queryKey: ["employees"],
    queryFn: () => getEmployees(authHeader),
    enabled: !!authHeader,
    ...options,
  });
};

export const useUpsertEmployee = () => {
  const { authHeader } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => upsertEmployee({ authHeader, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
};

export const useDeleteEmployee = () => {
  const { authHeader } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => deleteEmployee({ authHeader, id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
};