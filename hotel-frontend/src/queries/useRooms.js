import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";

const API_BASE = import.meta.env.DEV ? "/api" : "/hotel/api";

const getRooms = async (authHeader) => {
  const res = await fetch(`${API_BASE}/rooms`, { 
    headers: { Authorization: authHeader, Accept: "application/json" } 
  });
  if (!res.ok) throw new Error(`Načtení pokojů selhalo (${res.status})`);
  const data = await res.json();

  return Array.isArray(data)
    ? data.filter((room) => room.active !== false)
    : [];
}

const getRoomAmenities = async (authHeader) => {
  const res = await fetch(`${API_BASE}/room-amenities`, { 
    headers: { Authorization: authHeader, Accept: "application/json" } 
  });
  if (!res.ok) throw new Error(`Načtení vybavení pokojů selhalo (${res.status})`);
  const data = await res.json();
  return data ? data : [];
}

const getRoomTypes = async (authHeader) => {
  const res = await fetch(`${API_BASE}/room-types`, { 
    headers: { Authorization: authHeader, Accept: "application/json" } 
  });
  if (!res.ok) throw new Error(`Načtení typů pokojů selhalo (${res.status})`);
  const data = await res.json();
  return data ? data : [];
}

const upsertRoom = async ({ authHeader, payload }) => {
  const isEdit = !!payload.id;
  const url = isEdit ? `${API_BASE}/rooms/${payload.id}` : `${API_BASE}/rooms`;
  
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
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Uložení se nezdařilo (${res.status})`);
  }

  return res.json();
};

const upsertRoomAmenity = async ({ authHeader, payload }) => {
  const isEdit = !!payload.id;
  const url = isEdit ? `${API_BASE}/room-amenities/${payload.id}` : `${API_BASE}/room-amenities`;
  
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

const deleteRoomAmenity = async ({ authHeader, id }) => {
  const res = await fetch(`${API_BASE}/room-amenities/${id}`, {
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

export const useRooms = (options = {}) => {
  const { authHeader } = useAuth();

  return useQuery({
    queryKey: ["rooms"],
    queryFn: () => getRooms(authHeader),
    enabled: !!authHeader,
    ...options,
  });
};

export const useRoomAmenities = (options = {}) => {
  const { authHeader } = useAuth();

  return useQuery({
    queryKey: ["room-amenities"],
    queryFn: () => getRoomAmenities(authHeader),
    enabled: !!authHeader,
    ...options,
  });
};

export const useRoomTypes = (options = {}) => {
  const { authHeader } = useAuth();

  return useQuery({
    queryKey: ["room-types"],
    queryFn: () => getRoomTypes(authHeader),
    enabled: !!authHeader,
    ...options,
  });
};

export const useUpsertRoom = () => {
  const { authHeader } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => upsertRoom({ authHeader, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
};

export const useUpsertRoomAmenity = () => {
  const { authHeader } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => upsertRoomAmenity({ authHeader, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-amenities"] });
    },
  });
};

export const useDeleteRoomAmenity = () => {
  const { authHeader } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => deleteRoomAmenity({ authHeader, id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-amenities"] });
    },
  });
};