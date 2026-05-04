import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";

const API_BASE = import.meta.env.DEV ? "/api" : "/hotel/api";

const getCustomers = async (authHeader) => {
  const res = await fetch(`${API_BASE}/customers`, { 
    headers: { Authorization: authHeader, Accept: "application/json" } 
  });
  if (!res.ok) throw new Error(`Načtení zákazníků selhalo (${res.status})`);
  const data = await res.json();

  return data ? data : [];
};

const upsertCustomer = async ({ authHeader, payload }) => {
  const isEdit = !!payload.id;
  const url = isEdit ? `${API_BASE}/customers/${payload.id}` : `${API_BASE}/customers`;
  
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

const deleteCustomer = async ({ authHeader, id }) => {
  const res = await fetch(`${API_BASE}/customers/${id}`, {
    method: "DELETE",
    headers: { 
      Authorization: authHeader,
      Accept: "application/json" 
    },
  });

  if (!res.ok) {
    const errorData = await res.text().catch(() => ({}));
    throw new Error(errorData || `Smazání zákazníka selhalo (${res.status})`);
  }

  return true;
};

export const useCustomers = (options = {}) => {
  const { authHeader } = useAuth();

  return useQuery({
    queryKey: ["customers"],
    queryFn: () => getCustomers(authHeader),
    enabled: !!authHeader,
    ...options,
  });
};

export const useUpsertCustomer = () => {
  const { authHeader } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => upsertCustomer({ authHeader, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
};

export const useDeleteCustomer = () => {
  const { authHeader } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => deleteCustomer({ authHeader, id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
};