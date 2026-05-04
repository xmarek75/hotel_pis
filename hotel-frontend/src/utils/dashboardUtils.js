export function addDays(date, amount) {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatDayLabel(date, range = "week") {
  if (range === "month") {
    return date.toLocaleDateString("cs-CZ", { day: "2-digit" });
  }
  if (range === "tenDays") {
    return date.toLocaleDateString("cs-CZ", { day: "2-digit", month: "2-digit" });
  }
  return date.toLocaleDateString("cs-CZ", { weekday: "short", day: "2-digit", month: "2-digit" });
}

export function formatMonthLabel(date) {
  return `${date.getMonth() + 1}.`;
}

export function formatIsoDay(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function startOfWeek(date) {
  const d = startOfDay(date);
  const day = d.getDay();
  const diffToMonday = (day + 6) % 7;
  d.setDate(d.getDate() - diffToMonday);
  return d;
}

export function formatRangeLabel(fromDate, toDate) {
  const from = fromDate.toLocaleDateString("cs-CZ", { day: "2-digit", month: "2-digit" });
  const to = toDate.toLocaleDateString("cs-CZ", { day: "2-digit", month: "2-digit" });
  return `${from} - ${to}`;
}

export function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("cs-CZ");
}

export function parseLocalDate(dateStr) {
  return dateStr ? new Date(`${dateStr}T00:00:00`) : null;
}

export function formatDate(value) {
  if (!value) return "-";
  const d = parseLocalDate(value);
  if (!d || Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("cs-CZ");
}

export function calculateAgeFromDate(value) {
  if (!value) return null;
  const dob = parseLocalDate(value);
  if (!dob || Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

export function formatMoney(value) {
  if (value == null || value === "") return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "EUR" }).format(num);
}

export function getRoomTypeName(roomOrType) {
  const value = roomOrType?.type ?? roomOrType;
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.name ?? "";
}

export function getRoomTypeId(roomOrType) {
  const value = roomOrType?.type ?? roomOrType;
  return value?.id != null ? String(value.id) : "";
}

export function getRoomServiceIds(room) {
  if (!Array.isArray(room?.services)) return [];
  return room.services
    .map((service) => (service?.id != null ? String(service.id) : ""))
    .filter(Boolean);
}

export function formatRoomServices(room) {
  if (!Array.isArray(room?.services) || room.services.length === 0) {
    return "-";
  }
  return room.services
    .map((service) => service?.name?.trim())
    .filter(Boolean)
    .join(", ");
}

export function normalizeServiceSelections(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      const serviceId = item?.serviceId != null ? String(item.serviceId) : "";
      const quantity = Math.max(1, Number(item?.quantity ?? 1));
      return serviceId ? { serviceId, quantity } : null;
    })
    .filter(Boolean);
}

export function mapReservationServiceItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      const serviceId = item?.service?.id != null ? String(item.service.id) : "";
      const quantity = Math.max(1, Number(item?.quantity ?? 1));
      return serviceId ? { serviceId, quantity } : null;
    })
    .filter(Boolean);
}

export function buildReservationServicePayload(items) {
  return normalizeServiceSelections(items).map((item) => ({
    serviceId: Number(item.serviceId),
    quantity: Number(item.quantity),
  }));
}

export function calculateSelectedServicesTotal(items, services) {
  const safeItems = normalizeServiceSelections(items);
  if (safeItems.length === 0) return 0;

  return safeItems.reduce((sum, item) => {
    const service = services.find((entry) => String(entry.id) === String(item.serviceId));
    const price = Number(service?.price ?? 0);
    return sum + (Number.isFinite(price) ? price : 0) * Math.max(1, Number(item.quantity));
  }, 0);
}

export function isReservationActive(status) {
  return status !== "CANCELED";
}

export function calculateReservationNights(checkInDate, checkOutDate) {
  const start = parseLocalDate(checkInDate);
  const end = parseLocalDate(checkOutDate);
  if (!start || !end || !(end > start)) return 0;
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((end - start) / msPerDay);
}

export function calculateReservationServicesTotal(items) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => {
    const explicitTotal = Number(item?.totalPrice);
    if (Number.isFinite(explicitTotal)) {
      return sum + explicitTotal;
    }
    const priceAtTime = Number(item?.priceAtTime ?? 0);
    const quantity = Math.max(1, Number(item?.quantity ?? 1));
    return sum + (Number.isFinite(priceAtTime) ? priceAtTime : 0) * quantity;
  }, 0);
}

export function enrichReservation(reservation, rooms, customers, employees, services) {
  const roomId = reservation?.roomId ?? reservation?.room?.id ?? null;
  const customerId = reservation?.customerId ?? reservation?.customer?.id ?? null;
  const employeeId = reservation?.employeeId ?? reservation?.employee?.id ?? null;

  const room = rooms.find((item) => Number(item.id) === Number(roomId)) ?? reservation?.room ?? null;
  const customer =
    customers.find((item) => Number(item.id) === Number(customerId)) ?? reservation?.customer ?? null;
  const employee =
    employees.find((item) => Number(item.id) === Number(employeeId)) ?? reservation?.employee ?? null;

  const serviceItems = Array.isArray(reservation?.serviceItems)
    ? reservation.serviceItems.map((item) => {
        const fallbackServiceId = item?.serviceId ?? item?.service?.id ?? null;
        const service =
          item?.service
          ?? services.find((entry) => Number(entry.id) === Number(fallbackServiceId))
          ?? null;
        return {
          ...item,
          service,
        };
      })
    : [];

  const roomPricePerNight = Number(room?.pricePerNight ?? 0);
  const nights = calculateReservationNights(reservation?.checkInDate, reservation?.checkOutDate);
  const servicesTotal = calculateReservationServicesTotal(serviceItems);
  const roomTotal = roomPricePerNight * nights;

  return {
    ...reservation,
    roomId,
    customerId,
    employeeId,
    room,
    customer,
    employee,
    serviceItems,
    roomNumber: reservation?.roomNumber ?? room?.number ?? null,
    roomType: reservation?.roomType ?? getRoomTypeName(room) ?? null,
    roomCapacity: reservation?.roomCapacity ?? room?.capacity ?? null,
    roomPricePerNight: reservation?.roomPricePerNight ?? room?.pricePerNight ?? null,
    customerName: reservation?.customerName ?? customer?.name ?? null,
    customerEmail: reservation?.customerEmail ?? customer?.email ?? null,
    customerPhone: reservation?.customerPhone ?? customer?.phone ?? null,
    customerDateOfBirth: reservation?.customerDateOfBirth ?? customer?.dateOfBirth ?? null,
    employeeName: reservation?.employeeName ?? employee?.name ?? null,
    employeeUsername: reservation?.employeeUsername ?? employee?.username ?? null,
    employeeRole: reservation?.employeeRole ?? employee?.role ?? null,
    totalPrice: reservation?.totalPrice ?? roomTotal + servicesTotal,
  };
}

export function getCellOccupancy(room, day, reservations) {
  const roomId = room.id ?? null;
  const dayStart = startOfDay(day);
  let arrivalReservation = null;
  let departureReservation = null;

  for (const reservation of reservations) {
    if (!isReservationActive(reservation.status)) {
      continue;
    }

    const reservationRoomId = reservation.roomId ?? reservation.room?.id ?? null;
    if (roomId == null || reservationRoomId == null || Number(reservationRoomId) !== Number(roomId)) {
      continue;
    }

    const checkIn = parseLocalDate(reservation.checkInDate);
    const checkOut = parseLocalDate(reservation.checkOutDate);
    if (!checkIn || !checkOut) {
      continue;
    }

    if (dayStart > checkIn && dayStart < checkOut) {
      return { state: "reserved", reservation };
    }
    if (dayStart.getTime() === checkIn.getTime()) {
      arrivalReservation = reservation;
    }
    if (dayStart.getTime() === checkOut.getTime()) {
      departureReservation = reservation;
    }
  }

  if (arrivalReservation && departureReservation) {
    return { state: "turnover", reservation: arrivalReservation };
  }
  if (arrivalReservation) {
    return { state: "arrival", reservation: arrivalReservation };
  }
  if (departureReservation) {
    return { state: "departure", reservation: departureReservation };
  }
  return { state: "free", reservation: null };
}

export const mapRole = (role) => {
  switch (role) {
    case "ADMINISTRATOR": return "Administrátor";
    case "MANAGER": return "Manažer";
    case "RECEPTIONIST": return "Recepční";
    default: return "-";
  }
}
