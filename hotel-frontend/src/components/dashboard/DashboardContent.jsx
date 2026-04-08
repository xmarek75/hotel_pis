import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import DashboardHeader from "./DashboardHeader";
import OccupancySection from "./sections/OccupancySection";
import ReservationsSection from "./sections/ReservationsSection";
import RoomsSection from "./sections/RoomsSection";
import ServicesSection from "./sections/ServicesSection";
import EmployeesSection from "./sections/EmployeesSection";

// Globalni konstanty pouzite napric dashboardem.
const DAYS_TO_SHOW = 7;
const RESERVATIONS_PAGE_SIZE = 40;
const RANGE_OPTIONS = {
  week: { label: "Týdenní", days: 7 },
  tenDays: { label: "10denní", days: 10 },
  month: { label: "Měsíční", days: 30 },
};
const RESERVATION_STATUSES = ["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELED"];
const PAYMENT_STATUSES = ["UNPAID", "PARTIALLY_PAID", "PAID", "REFUNDED"];
const RESERVATION_SORT_FIELDS = [
  { value: "id", label: "ID" },
  { value: "roomNumber", label: "Pokoj" },
  { value: "customerName", label: "Zakaznik" },
  { value: "checkInDate", label: "Od" },
  { value: "checkOutDate", label: "Do" },
  { value: "status", label: "Stav rezervace" },
  { value: "paymentStatus", label: "Stav platby" },
  { value: "totalPrice", label: "Cena" },
];
const EMPLOYEE_ROLES = ["ADMINISTRATOR", "RECEPTIONIST", "MANAGER"];

// Date/format helpery pro kalendar obsazenosti a tabulky.
function addDays(date, amount) {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDayLabel(date, range = "week") {
  if (range === "month") {
    return date.toLocaleDateString("cs-CZ", { day: "2-digit" });
  }
  if (range === "tenDays") {
    return date.toLocaleDateString("cs-CZ", { day: "2-digit", month: "2-digit" });
  }
  return date.toLocaleDateString("cs-CZ", { weekday: "short", day: "2-digit", month: "2-digit" });
}

function formatMonthLabel(date) {
  return `${date.getMonth() + 1}.`;
}

function formatIsoDay(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfWeek(date) {
  const d = startOfDay(date);
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  const diffToMonday = (day + 6) % 7;
  d.setDate(d.getDate() - diffToMonday);
  return d;
}

function formatRangeLabel(fromDate, toDate) {
  const from = fromDate.toLocaleDateString("cs-CZ", { day: "2-digit", month: "2-digit" });
  const to = toDate.toLocaleDateString("cs-CZ", { day: "2-digit", month: "2-digit" });
  return `${from} - ${to}`;
}

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("cs-CZ");
}

function formatDate(value) {
  if (!value) return "-";
  const d = parseLocalDate(value);
  if (!d || Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("cs-CZ");
}

function calculateAgeFromDate(value) {
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

function formatMoney(value) {
  if (value == null || value === "") return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "EUR" }).format(num);
}

function normalizeServiceSelections(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      const serviceId = item?.serviceId != null ? String(item.serviceId) : "";
      const quantity = Math.max(1, Number(item?.quantity ?? 1));
      return serviceId ? { serviceId, quantity } : null;
    })
    .filter(Boolean);
}

function mapReservationServiceItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      const serviceId = item?.service?.id != null ? String(item.service.id) : "";
      const quantity = Math.max(1, Number(item?.quantity ?? 1));
      return serviceId ? { serviceId, quantity } : null;
    })
    .filter(Boolean);
}

function buildReservationServicePayload(items) {
  return normalizeServiceSelections(items).map((item) => ({
    service: { id: Number(item.serviceId) },
    quantity: Number(item.quantity),
  }));
}

function calculateSelectedServicesTotal(items, services) {
  const safeItems = normalizeServiceSelections(items);
  if (safeItems.length === 0) return 0;

  return safeItems.reduce((sum, item) => {
    const service = services.find((entry) => String(entry.id) === String(item.serviceId));
    const price = Number(service?.price ?? 0);
    return sum + (Number.isFinite(price) ? price : 0) * Math.max(1, Number(item.quantity));
  }, 0);
}

function parseLocalDate(dateStr) {
  return dateStr ? new Date(`${dateStr}T00:00:00`) : null;
}

function isReservationActive(status) {
  return status !== "CANCELED";
}

function getCellOccupancy(room, day, reservations) {
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

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout, username, role, authHeader } = useAuth();

  // Centralni state dashboardu (data, filtry, modaly, formulare a status hlasky).
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [services, setServices] = useState([]);
  const [reservationFilters, setReservationFilters] = useState({
    search: "",
    status: "ALL",
    paymentStatus: "ALL",
    roomNumber: "",
    fromDate: "",
    toDate: "",
  });
  const [reservationSort, setReservationSort] = useState({
    field: "checkInDate",
    direction: "desc",
  });
  const [reservationPage, setReservationPage] = useState(1);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeView, setActiveView] = useState("occupancy");
  const [occupancyRange, setOccupancyRange] = useState("week");
  const [occupancySettingsOpen, setOccupancySettingsOpen] = useState(false);
  const [occupancyCapacityMode, setOccupancyCapacityMode] = useState("all");
  const [occupancyCapacityValue, setOccupancyCapacityValue] = useState("4");
  const [weekStart, setWeekStart] = useState(() => startOfDay(new Date()));
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [reservationEditMode, setReservationEditMode] = useState(false);
  const [reservationActionStatus, setReservationActionStatus] = useState({ type: "idle", message: "" });
  const [reservationEditForm, setReservationEditForm] = useState({
    checkInDate: "",
    checkOutDate: "",
    numberOfGuests: 1,
    specialRequests: "",
    serviceItems: [],
    status: "PENDING",
    paymentStatus: "UNPAID",
  });
  const [createSlot, setCreateSlot] = useState(null);
  const [createStep, setCreateStep] = useState("form");
  const [createStatus, setCreateStatus] = useState({ type: "idle", message: "" });
  const [roomEditor, setRoomEditor] = useState(null);
  const [roomForm, setRoomForm] = useState({
    number: "",
    type: "STANDARD",
    capacity: 2,
    pricePerNight: "",
    active: true,
  });
  const [roomStatus, setRoomStatus] = useState({ type: "idle", message: "" });
  const [serviceEditor, setServiceEditor] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    price: "",
    description: "",
  });
  const [serviceStatus, setServiceStatus] = useState({ type: "idle", message: "" });
  const [employeeEditor, setEmployeeEditor] = useState(null);
  const [employeeForm, setEmployeeForm] = useState({
    name: "",
    username: "",
    contact: "",
    role: "RECEPTIONIST",
    password: "",
    passwordConfirm: "",
  });
  const [employeePasswordEditor, setEmployeePasswordEditor] = useState(null);
  const [employeePasswordForm, setEmployeePasswordForm] = useState({
    password: "",
    passwordConfirm: "",
  });
  const [employeePasswordStatus, setEmployeePasswordStatus] = useState({ type: "idle", message: "" });
  const [employeeStatus, setEmployeeStatus] = useState({ type: "idle", message: "" });
  const [createForm, setCreateForm] = useState({
    checkOutDate: "",
    numberOfGuests: 1,
    specialRequests: "",
    serviceItems: [],
    customerMode: "existing",
    existingCustomerId: "",
    newCustomerName: "",
    newCustomerDateOfBirth: "",
    newCustomerEmail: "",
    newCustomerPhone: "",
  });
  const [customerSearch, setCustomerSearch] = useState("");
  const isAdmin = role === "administrator";
  const isManager = role === "MANAGER";
  const canManageRooms = isAdmin;
  const canManageServices = isAdmin || isManager;
  const canManageEmployees = isAdmin;

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  function openReservationDetail(reservation) {
    setSelectedReservation(reservation);
    setReservationEditMode(false);
    setReservationActionStatus({ type: "idle", message: "" });
    setReservationEditForm({
      checkInDate: reservation?.checkInDate ?? "",
      checkOutDate: reservation?.checkOutDate ?? "",
      numberOfGuests: reservation?.numberOfGuests ?? 1,
      specialRequests: reservation?.specialRequests ?? "",
      serviceItems: mapReservationServiceItems(reservation?.serviceItems),
      status: reservation?.status ?? "PENDING",
      paymentStatus: reservation?.paymentStatus ?? "UNPAID",
    });
  }

  function closeReservationDetail() {
    setSelectedReservation(null);
    setReservationEditMode(false);
    setReservationActionStatus({ type: "idle", message: "" });
  }

  // Inicialni nacteni dat po prihlaseni / zmene auth kontextu.
  useEffect(() => {
    let ignore = false;

    async function loadData() {
      setLoading(true);
      setError("");
      try {
        const headers = {
          Authorization: authHeader,
          Accept: "application/json",
        };
        const [roomsRes, reservationsRes, customersRes, servicesRes] = await Promise.all([
          fetch("/api/rooms", { headers }),
          fetch("/api/reservations", { headers }),
          fetch("/api/customers", { headers }),
          fetch("/api/services", { headers }),
        ]);

        if (!roomsRes.ok) {
          throw new Error(`Načtení pokojů selhalo (${roomsRes.status})`);
        }
        if (!reservationsRes.ok) {
          throw new Error(`Načtení rezervací selhalo (${reservationsRes.status})`);
        }
        if (!customersRes.ok) {
          throw new Error(`Načtení zákazníků selhalo (${customersRes.status})`);
        }
        if (!servicesRes.ok) {
          throw new Error(`Načtení služeb selhalo (${servicesRes.status})`);
        }

        const roomsData = await roomsRes.json();
        const reservationsData = await reservationsRes.json();
        const customersData = await customersRes.json();
        const servicesData = await servicesRes.json();

        const activeRooms = Array.isArray(roomsData)
          ? roomsData.filter((room) => room.active !== false)
          : [];
        const safeReservations = Array.isArray(reservationsData) ? reservationsData : [];
        const safeCustomers = Array.isArray(customersData) ? customersData : [];
        const safeServices = Array.isArray(servicesData) ? servicesData : [];
        let safeEmployees = [];
        if (role === "administrator") {
          const employeesRes = await fetch("/api/employees", { headers });
          if (employeesRes.ok) {
            const employeesData = await employeesRes.json();
            safeEmployees = Array.isArray(employeesData) ? employeesData : [];
          } else if (employeesRes.status !== 401 && employeesRes.status !== 403) {
            throw new Error(`Načtení zaměstnanců selhalo (${employeesRes.status})`);
          }
        }

        if (!ignore) {
          setRooms(activeRooms);
          setReservations(safeReservations);
          setCustomers(safeCustomers);
          setServices(safeServices);
          setEmployees(safeEmployees);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Nepodařilo se načíst data.");
          setRooms([]);
          setReservations([]);
          setCustomers([]);
          setServices([]);
          setEmployees([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, [authHeader, role]);

  // Odvozena data pro UI: dny v kalendari, popisky a titul stranky.
  const weekDays = useMemo(() => {
    const count = RANGE_OPTIONS[occupancyRange]?.days ?? DAYS_TO_SHOW;
    return Array.from({ length: count }, (_, index) => addDays(weekStart, index));
  }, [occupancyRange, weekStart]);

  const weekRangeLabel = useMemo(
    () => formatRangeLabel(weekDays[0], weekDays[weekDays.length - 1]),
    [weekDays]
  );
  const rangeHeadline = useMemo(() => {
    if (occupancyRange === "month") return `Zobrazené dny: ${weekRangeLabel}`;
    if (occupancyRange === "tenDays") return `Zobrazených 10 dní: ${weekRangeLabel}`;
    return `Zobrazený týden: ${weekRangeLabel}`;
  }, [occupancyRange, weekRangeLabel]);
  const viewTitle = useMemo(() => {
    if (activeView === "occupancy") return "Dashboard-obsazenost";
    if (activeView === "reservations") return "Správa rezervací";
    if (activeView === "rooms") return "Správa pokojů";
    if (activeView === "services") return "Správa služeb";
    return "Správa zaměstnanců";
  }, [activeView]);

  const filteredOccupancyRooms = useMemo(() => {
    if (occupancyCapacityMode === "all") {
      return rooms;
    }
    const limit = Number(occupancyCapacityValue);
    if (!Number.isFinite(limit) || limit <= 0) {
      return rooms;
    }
    return rooms.filter((room) => {
      const capacity = Number(room.capacity ?? 0);
      if (!Number.isFinite(capacity) || capacity <= 0) return false;
      if (occupancyCapacityMode === "exact") {
        return capacity === limit;
      }
      return capacity >= limit;
    });
  }, [rooms, occupancyCapacityMode, occupancyCapacityValue]);

  // Klientska filtrace a razeni seznamu rezervaci pro sekci "Sprava rezervaci".
  const filteredReservations = useMemo(() => {
    const normalizedSearch = reservationFilters.search.trim().toLowerCase();

    const filtered = reservations.filter((reservation) => {
      if (reservationFilters.status !== "ALL" && reservation.status !== reservationFilters.status) {
        return false;
      }
      if (
        reservationFilters.paymentStatus !== "ALL"
        && reservation.paymentStatus !== reservationFilters.paymentStatus
      ) {
        return false;
      }
      if (reservationFilters.roomNumber.trim()) {
        const roomVal = String(reservation.roomNumber ?? "").toLowerCase();
        const roomFilter = reservationFilters.roomNumber.trim().toLowerCase();
        if (!roomVal.includes(roomFilter)) {
          return false;
        }
      }
      if (reservationFilters.fromDate && reservation.checkInDate < reservationFilters.fromDate) {
        return false;
      }
      if (reservationFilters.toDate && reservation.checkOutDate > reservationFilters.toDate) {
        return false;
      }
      if (!normalizedSearch) {
        return true;
      }

      const searchable = [
        reservation.id,
        reservation.customerName,
        reservation.roomNumber,
        reservation.status,
        reservation.paymentStatus,
      ].map((value) => String(value ?? "").toLowerCase());

      return searchable.some((value) => value.includes(normalizedSearch));
    });

    return [...filtered].sort((a, b) => {
      const field = reservationSort.field;
      const direction = reservationSort.direction === "asc" ? 1 : -1;

      if (field === "checkInDate" || field === "checkOutDate") {
        const aDate = parseLocalDate(a[field])?.getTime() ?? 0;
        const bDate = parseLocalDate(b[field])?.getTime() ?? 0;
        return (aDate - bDate) * direction;
      }

      if (field === "id" || field === "roomNumber" || field === "totalPrice") {
        const aNum = Number(a[field] ?? 0);
        const bNum = Number(b[field] ?? 0);
        return (aNum - bNum) * direction;
      }

      const aText = String(a[field] ?? "").toLowerCase();
      const bText = String(b[field] ?? "").toLowerCase();
      return aText.localeCompare(bText, "cs") * direction;
    });
  }, [reservations, reservationFilters, reservationSort]);

  const reservationTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredReservations.length / RESERVATIONS_PAGE_SIZE)),
    [filteredReservations.length]
  );

  const pagedReservations = useMemo(() => {
    const start = (reservationPage - 1) * RESERVATIONS_PAGE_SIZE;
    return filteredReservations.slice(start, start + RESERVATIONS_PAGE_SIZE);
  }, [filteredReservations, reservationPage]);

  useEffect(() => {
    setReservationPage(1);
  }, [reservationFilters, reservationSort]);

  useEffect(() => {
    setReservationPage((prev) => Math.min(Math.max(prev, 1), reservationTotalPages));
  }, [reservationTotalPages]);

  function updateReservationFilter(field, value) {
    setReservationFilters((prev) => ({ ...prev, [field]: value }));
  }

  function resetReservationFilters() {
    setReservationFilters({
      search: "",
      status: "ALL",
      paymentStatus: "ALL",
      roomNumber: "",
      fromDate: "",
      toDate: "",
    });
    setReservationSort({
      field: "checkInDate",
      direction: "desc",
    });
    setReservationPage(1);
  }

  function goPrevWeek() {
    setWeekStart((prev) => addDays(prev, -7));
  }

  function goNextWeek() {
    setWeekStart((prev) => addDays(prev, 7));
  }

  function goPrevDay() {
    setWeekStart((prev) => addDays(prev, -1));
  }

  function goNextDay() {
    setWeekStart((prev) => addDays(prev, 1));
  }

  function onWeekDateChange(e) {
    if (!e.target.value) return;
    setWeekStart(startOfDay(new Date(e.target.value)));
  }

  // Globalni klavesova zkratka: Esc zavira aktivni modaly.
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") {
        closeReservationDetail();
        setCreateSlot(null);
        setOccupancySettingsOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Preview ceny pred potvrzenim vytvoreni nove rezervace.
  const createPreview = useMemo(() => {
    if (!createSlot) return null;
    const roomPrice = Number(createSlot.room?.pricePerNight ?? 0);
    const start = parseLocalDate(createSlot.startDateIso);
    const end = parseLocalDate(createForm.checkOutDate);
    const servicesTotal = calculateSelectedServicesTotal(createForm.serviceItems, services);
    if (!start || !end || !(end > start)) {
      return { nights: 0, roomTotal: 0, servicesTotal, total: servicesTotal, roomPrice };
    }
    const msPerDay = 24 * 60 * 60 * 1000;
    const nights = Math.round((end - start) / msPerDay);
    const roomTotal = nights * roomPrice;
    return { nights, roomTotal, servicesTotal, total: roomTotal + servicesTotal, roomPrice };
  }, [createForm.checkOutDate, createForm.serviceItems, createSlot, services]);

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((customer) => {
      const name = String(customer.name ?? "").toLowerCase();
      const email = String(customer.email ?? "").toLowerCase();
      const phone = String(customer.phone ?? "").toLowerCase();
      return [name, email, phone].some((value) => value.includes(query));
    });
  }, [customers, customerSearch]);

  function openCreateReservation(room, day) {
    const startDateIso = formatIsoDay(day);
    const defaultEndIso = formatIsoDay(addDays(day, 1));
    setCreateSlot({ room, startDateIso });
    setCreateStep("form");
    setCreateStatus({ type: "idle", message: "" });
    setCustomerSearch("");
    setCreateForm({
      checkOutDate: defaultEndIso,
      numberOfGuests: 1,
      specialRequests: "",
      serviceItems: [],
      customerMode: "existing",
      existingCustomerId: customers[0]?.id ? String(customers[0].id) : "",
      newCustomerName: "",
      newCustomerDateOfBirth: "",
      newCustomerEmail: "",
      newCustomerPhone: "",
    });
  }

  function closeCreateReservation() {
    setCreateSlot(null);
    setCreateStatus({ type: "idle", message: "" });
    setCreateStep("form");
    setCustomerSearch("");
  }

  function updateCreateForm(field, value) {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateReservationEditForm(field, value) {
    setReservationEditForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleCreateService(serviceId, enabled) {
    setCreateForm((prev) => {
      const current = normalizeServiceSelections(prev.serviceItems);
      const normalizedId = String(serviceId);
      const exists = current.some((item) => item.serviceId === normalizedId);

      if (enabled && !exists) {
        return {
          ...prev,
          serviceItems: [...current, { serviceId: normalizedId, quantity: 1 }],
        };
      }
      if (!enabled && exists) {
        return {
          ...prev,
          serviceItems: current.filter((item) => item.serviceId !== normalizedId),
        };
      }
      return prev;
    });
  }

  function updateCreateServiceQuantity(serviceId, quantity) {
    setCreateForm((prev) => ({
      ...prev,
      serviceItems: normalizeServiceSelections(prev.serviceItems).map((item) =>
        item.serviceId === String(serviceId)
          ? { ...item, quantity: Math.max(1, Number(quantity) || 1) }
          : item
      ),
    }));
  }

  function toggleReservationService(serviceId, enabled) {
    setReservationEditForm((prev) => {
      const current = normalizeServiceSelections(prev.serviceItems);
      const normalizedId = String(serviceId);
      const exists = current.some((item) => item.serviceId === normalizedId);

      if (enabled && !exists) {
        return {
          ...prev,
          serviceItems: [...current, { serviceId: normalizedId, quantity: 1 }],
        };
      }
      if (!enabled && exists) {
        return {
          ...prev,
          serviceItems: current.filter((item) => item.serviceId !== normalizedId),
        };
      }
      return prev;
    });
  }

  function updateReservationServiceQuantity(serviceId, quantity) {
    setReservationEditForm((prev) => ({
      ...prev,
      serviceItems: normalizeServiceSelections(prev.serviceItems).map((item) =>
        item.serviceId === String(serviceId)
          ? { ...item, quantity: Math.max(1, Number(quantity) || 1) }
          : item
      ),
    }));
  }

  useEffect(() => {
    if (createForm.customerMode !== "existing" || !createForm.existingCustomerId) return;
    const visible = filteredCustomers.some(
      (customer) => String(customer.id) === String(createForm.existingCustomerId)
    );
    if (!visible) {
      setCreateForm((prev) => ({ ...prev, existingCustomerId: "" }));
    }
  }, [filteredCustomers, createForm.customerMode, createForm.existingCustomerId]);

  // Validace a submit vytvoreni rezervace.
  function validateCreateForm() {
    const start = parseLocalDate(createSlot?.startDateIso);
    const end = parseLocalDate(createForm.checkOutDate);
    if (!start || !end || !(end > start)) {
      return "Konec rezervace musí být po datu začátku.";
    }
    const guests = Number(createForm.numberOfGuests);
    if (!guests || guests <= 0) {
      return "Počet hostů musí být větší než 0.";
    }
    if (guests > Number(createSlot?.room?.capacity ?? guests)) {
      return "Počet hostů překračuje kapacitu pokoje.";
    }
    if (createForm.customerMode === "existing" && !createForm.existingCustomerId) {
      return "Vyber existujícího zákazníka.";
    }
    if (createForm.customerMode === "new") {
      if (!createForm.newCustomerName.trim()) return "U nového zákazníka vyplň jméno.";
      if (!createForm.newCustomerDateOfBirth) return "U nového zákazníka vyplň datum narození.";
      if (!createForm.newCustomerEmail.trim()) return "U nového zákazníka vyplň e-mail.";
      if (!createForm.newCustomerPhone.trim()) return "U nového zákazníka vyplň telefon.";
      const age = calculateAgeFromDate(createForm.newCustomerDateOfBirth);
      if (age == null || age < 0) return "U nového zákazníka vyplň platné datum narození.";
    }
    return "";
  }

  async function submitReservationCreate() {
    if (!createSlot) return;
    setCreateStatus({ type: "loading", message: "Vytvářím rezervaci..." });

    try {
      const headers = {
        Authorization: authHeader,
        Accept: "application/json",
        "Content-Type": "application/json",
      };

      let customerId = null;
      if (createForm.customerMode === "existing") {
        customerId = Number(createForm.existingCustomerId);
      } else {
        const customerPayload = {
          name: createForm.newCustomerName.trim(),
          dateOfBirth: createForm.newCustomerDateOfBirth,
          email: createForm.newCustomerEmail.trim(),
          phone: createForm.newCustomerPhone.trim(),
        };
        const customerRes = await fetch("/api/customers", {
          method: "POST",
          headers,
          body: JSON.stringify(customerPayload),
        });
        if (!customerRes.ok) {
          const txt = await customerRes.text().catch(() => "");
          throw new Error(`Vytvoření zákazníka selhalo (${customerRes.status})${txt ? `: ${txt}` : ""}`);
        }
        const createdCustomer = await customerRes.json();
        customerId = createdCustomer?.id;
      }

      if (!customerId) {
        throw new Error("Nebyl vybrán zákazník.");
      }

      const reservationPayload = {
        checkInDate: createSlot.startDateIso,
        checkOutDate: createForm.checkOutDate,
        numberOfGuests: Number(createForm.numberOfGuests),
        specialRequests: createForm.specialRequests?.trim() || null,
        serviceItems: buildReservationServicePayload(createForm.serviceItems),
        roomId: Number(createSlot.room.id),
        customerId: Number(customerId),
      };

      const reservationRes = await fetch("/api/reservations", {
        method: "POST",
        headers,
        body: JSON.stringify(reservationPayload),
      });

      if (!reservationRes.ok) {
        const txt = await reservationRes.text().catch(() => "");
        throw new Error(`Vytvoření rezervace selhalo (${reservationRes.status})${txt ? `: ${txt}` : ""}`);
      }

      setCreateStatus({ type: "success", message: "Rezervace byla vytvořena." });

      const [roomsRes, reservationsRes, customersRes] = await Promise.all([
        fetch("/api/rooms", { headers: { Authorization: authHeader, Accept: "application/json" } }),
        fetch("/api/reservations", { headers: { Authorization: authHeader, Accept: "application/json" } }),
        fetch("/api/customers", { headers: { Authorization: authHeader, Accept: "application/json" } }),
      ]);
      if (roomsRes.ok) {
        const roomsData = await roomsRes.json();
        setRooms(Array.isArray(roomsData) ? roomsData.filter((r) => r.active !== false) : []);
      }
      if (reservationsRes.ok) {
        const reservationsData = await reservationsRes.json();
        setReservations(Array.isArray(reservationsData) ? reservationsData : []);
      }
      if (customersRes.ok) {
        const customersData = await customersRes.json();
        setCustomers(Array.isArray(customersData) ? customersData : []);
      }

      closeCreateReservation();
    } catch (err) {
      setCreateStatus({ type: "error", message: err.message || "Nepodařilo se vytvořit rezervaci." });
    }
  }

  function validateReservationEdit() {
    const inDate = parseLocalDate(reservationEditForm.checkInDate);
    const outDate = parseLocalDate(reservationEditForm.checkOutDate);
    if (!inDate || !outDate || !(outDate > inDate)) {
      return "Konec rezervace musí být po datu začátku.";
    }
    const guests = Number(reservationEditForm.numberOfGuests);
    if (!guests || guests <= 0) {
      return "Počet hostů musí být větší než 0.";
    }
    if (selectedReservation?.roomCapacity && guests > Number(selectedReservation.roomCapacity)) {
      return "Počet hostů překračuje kapacitu pokoje.";
    }
    return "";
  }

  async function submitReservationUpdate() {
    if (!selectedReservation) return;
    const validation = validateReservationEdit();
    if (validation) {
      setReservationActionStatus({ type: "error", message: validation });
      return;
    }

    setReservationActionStatus({ type: "loading", message: "Ukládám změny rezervace..." });
    try {
      const payload = {
        checkInDate: reservationEditForm.checkInDate,
        checkOutDate: reservationEditForm.checkOutDate,
        numberOfGuests: Number(reservationEditForm.numberOfGuests),
        specialRequests: reservationEditForm.specialRequests?.trim() || null,
        serviceItems: buildReservationServicePayload(reservationEditForm.serviceItems),
        status: reservationEditForm.status,
        paymentStatus: reservationEditForm.paymentStatus,
      };
      const headers = {
        Authorization: authHeader,
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      const updateRes = await fetch(`/api/reservations/${selectedReservation.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });
      if (!updateRes.ok) {
        const txt = await updateRes.text().catch(() => "");
        throw new Error(`Uložení změn selhalo (${updateRes.status})${txt ? `: ${txt}` : ""}`);
      }
      const updated = await updateRes.json();
      setSelectedReservation(updated);
      setReservationEditMode(false);
      setReservationActionStatus({ type: "success", message: "Rezervace byla upravena." });

      const [roomsRes, reservationsRes] = await Promise.all([
        fetch("/api/rooms", { headers: { Authorization: authHeader, Accept: "application/json" } }),
        fetch("/api/reservations", { headers: { Authorization: authHeader, Accept: "application/json" } }),
      ]);
      if (roomsRes.ok) {
        const roomsData = await roomsRes.json();
        setRooms(Array.isArray(roomsData) ? roomsData.filter((r) => r.active !== false) : []);
      }
      if (reservationsRes.ok) {
        const reservationsData = await reservationsRes.json();
        const safe = Array.isArray(reservationsData) ? reservationsData : [];
        setReservations(safe);
        const newer = safe.find((r) => Number(r.id) === Number(updated.id));
        if (newer) {
          setSelectedReservation(newer);
        }
      }
    } catch (err) {
      setReservationActionStatus({ type: "error", message: err.message || "Nepodařilo se upravit rezervaci." });
    }
  }

  async function submitReservationStatusUpdate() {
    if (!selectedReservation) return;
    setReservationActionStatus({ type: "loading", message: "Ukládám stavy rezervace..." });
    try {
      const payload = {
        status: reservationEditForm.status,
        paymentStatus: reservationEditForm.paymentStatus,
      };
      const headers = {
        Authorization: authHeader,
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      const updateRes = await fetch(`/api/reservations/${selectedReservation.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });
      if (!updateRes.ok) {
        const txt = await updateRes.text().catch(() => "");
        throw new Error(`Uložení stavů selhalo (${updateRes.status})${txt ? `: ${txt}` : ""}`);
      }
      const updated = await updateRes.json();
      setSelectedReservation(updated);
      setReservationActionStatus({ type: "success", message: "Stavy byly upraveny." });

      const reservationsRes = await fetch("/api/reservations", {
        headers: { Authorization: authHeader, Accept: "application/json" },
      });
      if (reservationsRes.ok) {
        const reservationsData = await reservationsRes.json();
        const safe = Array.isArray(reservationsData) ? reservationsData : [];
        setReservations(safe);
        const newer = safe.find((r) => Number(r.id) === Number(updated.id));
        if (newer) {
          setSelectedReservation(newer);
          setReservationEditForm((prev) => ({
            ...prev,
            status: newer.status ?? prev.status,
            paymentStatus: newer.paymentStatus ?? prev.paymentStatus,
          }));
        }
      }
    } catch (err) {
      setReservationActionStatus({ type: "error", message: err.message || "Nepodařilo se upravit stavy." });
    }
  }

  async function cancelReservation() {
    if (!selectedReservation) return;
    if (!window.confirm("Opravdu chceš tuto rezervaci úplně zrušit?")) {
      return;
    }
    setReservationActionStatus({ type: "loading", message: "Ruším rezervaci..." });
    try {
      const res = await fetch(`/api/reservations/${selectedReservation.id}`, {
        method: "DELETE",
        headers: {
          Authorization: authHeader,
          Accept: "application/json",
        },
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Zrušení rezervace selhalo (${res.status})${txt ? `: ${txt}` : ""}`);
      }

      const [roomsRes, reservationsRes] = await Promise.all([
        fetch("/api/rooms", { headers: { Authorization: authHeader, Accept: "application/json" } }),
        fetch("/api/reservations", { headers: { Authorization: authHeader, Accept: "application/json" } }),
      ]);
      if (roomsRes.ok) {
        const roomsData = await roomsRes.json();
        setRooms(Array.isArray(roomsData) ? roomsData.filter((r) => r.active !== false) : []);
      }
      if (reservationsRes.ok) {
        const reservationsData = await reservationsRes.json();
        setReservations(Array.isArray(reservationsData) ? reservationsData : []);
      }

      closeReservationDetail();
    } catch (err) {
      setReservationActionStatus({ type: "error", message: err.message || "Nepodařilo se zrušit rezervaci." });
    }
  }

  function openCreateRoom() {
    setRoomEditor({ mode: "create", roomId: null });
    setRoomStatus({ type: "idle", message: "" });
    setRoomForm({
      number: "",
      type: "STANDARD",
      capacity: 2,
      pricePerNight: "",
      active: true,
    });
  }

  function openCreateService() {
    setServiceEditor({ mode: "create", serviceId: null });
    setServiceStatus({ type: "idle", message: "" });
    setServiceForm({
      name: "",
      price: "",
      description: "",
    });
  }

  function openEditService(service) {
    setServiceEditor({ mode: "edit", serviceId: service.id });
    setServiceStatus({ type: "idle", message: "" });
    setServiceForm({
      name: service.name ?? "",
      price: service.price ?? "",
      description: service.description ?? "",
    });
  }

  function closeServiceEditor() {
    setServiceEditor(null);
    setServiceStatus({ type: "idle", message: "" });
  }

  function updateServiceForm(field, value) {
    setServiceForm((prev) => ({ ...prev, [field]: value }));
  }

  function validateServiceForm() {
    if (!serviceForm.name?.trim()) return "Název služby je povinný.";
    if (!serviceForm.description?.trim()) return "Popis služby je povinný.";
    const price = Number(serviceForm.price);
    if (Number.isNaN(price) || price < 0) return "Cena služby musí být číslo >= 0.";
    return "";
  }

  async function refreshServices() {
    const servicesRes = await fetch("/api/services", {
      headers: { Authorization: authHeader, Accept: "application/json" },
    });
    if (!servicesRes.ok) {
      throw new Error(`Načtení služeb selhalo (${servicesRes.status})`);
    }
    const servicesData = await servicesRes.json();
    setServices(Array.isArray(servicesData) ? servicesData : []);
  }

  async function submitServiceEditor() {
    const validation = validateServiceForm();
    if (validation) {
      setServiceStatus({ type: "error", message: validation });
      return;
    }

    setServiceStatus({ type: "loading", message: "Ukládám službu..." });
    try {
      const payload = {
        name: serviceForm.name.trim(),
        description: serviceForm.description.trim(),
        price: Number(serviceForm.price),
      };
      const headers = {
        Authorization: authHeader,
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      const isEdit = serviceEditor?.mode === "edit" && serviceEditor.serviceId != null;
      const url = isEdit ? `/api/services/${serviceEditor.serviceId}` : "/api/services";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Uložení služby selhalo (${res.status})${txt ? `: ${txt}` : ""}`);
      }

      await refreshServices();
      setServiceStatus({ type: "success", message: "Služba byla uložena." });
      closeServiceEditor();
    } catch (err) {
      setServiceStatus({ type: "error", message: err.message || "Nepodařilo se uložit službu." });
    }
  }

  async function deleteService(service) {
    if (!service?.id) return;
    if (!window.confirm(`Opravdu chceš smazat službu ${service.name}?`)) {
      return;
    }

    setServiceStatus({ type: "loading", message: "Mažu službu..." });
    try {
      const res = await fetch(`/api/services/${service.id}`, {
        method: "DELETE",
        headers: {
          Authorization: authHeader,
          Accept: "application/json",
        },
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Smazání služby selhalo (${res.status})${txt ? `: ${txt}` : ""}`);
      }

      await refreshServices();
      setServiceStatus({ type: "success", message: "Služba byla smazána." });

      setCreateForm((prev) => ({
        ...prev,
        serviceItems: normalizeServiceSelections(prev.serviceItems).filter(
          (item) => String(item.serviceId) !== String(service.id)
        ),
      }));
      setReservationEditForm((prev) => ({
        ...prev,
        serviceItems: normalizeServiceSelections(prev.serviceItems).filter(
          (item) => String(item.serviceId) !== String(service.id)
        ),
      }));
    } catch (err) {
      setServiceStatus({ type: "error", message: err.message || "Nepodařilo se smazat službu." });
    }
  }

  function openEditRoom(room) {
    setRoomEditor({ mode: "edit", roomId: room.id });
    setRoomStatus({ type: "idle", message: "" });
    setRoomForm({
      number: room.number ?? "",
      type: room.type ?? "STANDARD",
      capacity: room.capacity ?? 1,
      pricePerNight: room.pricePerNight ?? "",
      active: room.active !== false,
    });
  }

  function closeRoomEditor() {
    setRoomEditor(null);
    setRoomStatus({ type: "idle", message: "" });
  }

  function updateRoomForm(field, value) {
    setRoomForm((prev) => ({ ...prev, [field]: value }));
  }

  function validateRoomForm() {
    if (!roomForm.number?.trim()) return "Číslo pokoje je povinné.";
    const capacity = Number(roomForm.capacity);
    if (!capacity || capacity <= 0) return "Kapacita musí být větší než 0.";
    const price = Number(roomForm.pricePerNight);
    if (Number.isNaN(price) || price < 0) return "Cena za noc musí být číslo >= 0.";
    return "";
  }

  function openCreateEmployee() {
    setEmployeeEditor({ mode: "create", employeeId: null });
    setEmployeeStatus({ type: "idle", message: "" });
    setEmployeeForm({
      name: "",
      username: "",
      contact: "",
      role: "RECEPTIONIST",
      password: "",
      passwordConfirm: "",
    });
  }

  function openEditEmployee(employee) {
    setEmployeeEditor({ mode: "edit", employeeId: employee.id });
    setEmployeeStatus({ type: "idle", message: "" });
    setEmployeeForm({
      name: employee.name ?? "",
      username: employee.username ?? "",
      contact: employee.contact ?? "",
      role: employee.role ?? "RECEPTIONIST",
      password: "",
      passwordConfirm: "",
    });
  }

  function closeEmployeeEditor() {
    setEmployeeEditor(null);
    setEmployeePasswordEditor(null);
    setEmployeePasswordForm({ password: "", passwordConfirm: "" });
    setEmployeePasswordStatus({ type: "idle", message: "" });
    setEmployeeStatus({ type: "idle", message: "" });
  }

  function updateEmployeeForm(field, value) {
    setEmployeeForm((prev) => ({ ...prev, [field]: value }));
  }

  function validateEmployeeForm() {
    if (!employeeForm.name?.trim()) return "Jméno zaměstnance je povinné.";
    if (!employeeForm.username?.trim()) return "Username je povinný.";
    if (!employeeForm.contact?.trim()) return "Kontakt je povinný.";
    if (!employeeForm.role?.trim()) return "Role je povinná.";
    const mustValidatePassword = employeeEditor?.mode === "create";
    if (mustValidatePassword && !employeeForm.password?.trim()) {
      return "Heslo je povinné pro nového zaměstnance.";
    }
    if (mustValidatePassword && employeeForm.password && employeeForm.password.length < 4) {
      return "Heslo musí mít alespoň 4 znaky.";
    }
    if (mustValidatePassword && employeeForm.password !== employeeForm.passwordConfirm) {
      return "Hesla se neshodují.";
    }
    return "";
  }

  async function refreshEmployees() {
    const employeesRes = await fetch("/api/employees", {
      headers: { Authorization: authHeader, Accept: "application/json" },
    });
    if (!employeesRes.ok) {
      if (employeesRes.status === 403) {
        setEmployees([]);
        return;
      }
      throw new Error(`Načtení zaměstnanců selhalo (${employeesRes.status})`);
    }
    const employeesData = await employeesRes.json();
    setEmployees(Array.isArray(employeesData) ? employeesData : []);
  }

  async function submitEmployeeEditor() {
    const validation = validateEmployeeForm();
    if (validation) {
      setEmployeeStatus({ type: "error", message: validation });
      return;
    }
    setEmployeeStatus({ type: "loading", message: "Ukládám zaměstnance..." });

    try {
      const payload = {
        name: employeeForm.name.trim(),
        username: employeeForm.username.trim(),
        contact: employeeForm.contact.trim(),
        role: employeeForm.role,
      };
      if (employeeEditor?.mode === "create" && employeeForm.password?.trim()) {
        payload.password = employeeForm.password.trim();
      }
      const headers = {
        Authorization: authHeader,
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      const isEdit = employeeEditor?.mode === "edit" && employeeEditor.employeeId != null;
      const url = isEdit ? `/api/employees/${employeeEditor.employeeId}` : "/api/employees";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Uložení zaměstnance selhalo (${res.status})${txt ? `: ${txt}` : ""}`);
      }

      await refreshEmployees();
      setEmployeeStatus({ type: "success", message: "Zaměstnanec byl uložen." });
      closeEmployeeEditor();
    } catch (err) {
      setEmployeeStatus({ type: "error", message: err.message || "Nepodařilo se uložit zaměstnance." });
    }
  }

  async function deleteEmployee(employee) {
    if (!employee?.id) return;
    if (!window.confirm(`Opravdu chceš smazat zaměstnance ${employee.username}?`)) {
      return;
    }
    setEmployeeStatus({ type: "loading", message: "Mažu zaměstnance..." });
    try {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: "DELETE",
        headers: {
          Authorization: authHeader,
          Accept: "application/json",
        },
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Smazání zaměstnance selhalo (${res.status})${txt ? `: ${txt}` : ""}`);
      }
      await refreshEmployees();
      setEmployeeStatus({ type: "success", message: "Zaměstnanec byl deaktivován." });
    } catch (err) {
      setEmployeeStatus({ type: "error", message: err.message || "Nepodařilo se smazat zaměstnance." });
    }
  }

  function openEmployeePasswordEditor() {
    if (!employeeEditor || employeeEditor.mode !== "edit" || !employeeEditor.employeeId) return;
    setEmployeePasswordEditor({
      employeeId: employeeEditor.employeeId,
      username: employeeForm.username || "",
    });
    setEmployeePasswordForm({ password: "", passwordConfirm: "" });
    setEmployeePasswordStatus({ type: "idle", message: "" });
  }

  function closeEmployeePasswordEditor() {
    setEmployeePasswordEditor(null);
    setEmployeePasswordForm({ password: "", passwordConfirm: "" });
    setEmployeePasswordStatus({ type: "idle", message: "" });
  }

  function updateEmployeePasswordForm(field, value) {
    setEmployeePasswordForm((prev) => ({ ...prev, [field]: value }));
  }

  function validateEmployeePasswordForm() {
    if (!employeePasswordForm.password?.trim()) return "Nové heslo je povinné.";
    if (employeePasswordForm.password.length < 4) return "Heslo musí mít alespoň 4 znaky.";
    if (employeePasswordForm.password !== employeePasswordForm.passwordConfirm) return "Hesla se neshodují.";
    return "";
  }

  async function submitEmployeePasswordChange() {
    if (!employeePasswordEditor?.employeeId) return;
    const validation = validateEmployeePasswordForm();
    if (validation) {
      setEmployeePasswordStatus({ type: "error", message: validation });
      return;
    }
    setEmployeePasswordStatus({ type: "loading", message: "Měním heslo..." });
    try {
      const res = await fetch(`/api/employees/${employeePasswordEditor.employeeId}`, {
        method: "PUT",
        headers: {
          Authorization: authHeader,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: employeePasswordForm.password.trim() }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Změna hesla selhala (${res.status})${txt ? `: ${txt}` : ""}`);
      }
      await refreshEmployees();
      setEmployeeStatus({ type: "success", message: "Heslo zaměstnance bylo změněno." });
      closeEmployeePasswordEditor();
    } catch (err) {
      setEmployeePasswordStatus({ type: "error", message: err.message || "Nepodařilo se změnit heslo." });
    }
  }

  async function submitRoomEditor() {
    const validation = validateRoomForm();
    if (validation) {
      setRoomStatus({ type: "error", message: validation });
      return;
    }
    setRoomStatus({ type: "loading", message: "Ukládám pokoj..." });

    try {
      const payload = {
        number: roomForm.number.trim(),
        type: roomForm.type.trim() || "STANDARD",
        capacity: Number(roomForm.capacity),
        pricePerNight: Number(roomForm.pricePerNight),
        active: !!roomForm.active,
      };
      const headers = {
        Authorization: authHeader,
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      const isEdit = roomEditor?.mode === "edit" && roomEditor.roomId != null;
      const url = isEdit ? `/api/rooms/${roomEditor.roomId}` : "/api/rooms";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Uložení pokoje selhalo (${res.status})${txt ? `: ${txt}` : ""}`);
      }

      const [roomsRes, reservationsRes, customersRes] = await Promise.all([
        fetch("/api/rooms", { headers: { Authorization: authHeader, Accept: "application/json" } }),
        fetch("/api/reservations", { headers: { Authorization: authHeader, Accept: "application/json" } }),
        fetch("/api/customers", { headers: { Authorization: authHeader, Accept: "application/json" } }),
      ]);
      if (roomsRes.ok) {
        const roomsData = await roomsRes.json();
        setRooms(Array.isArray(roomsData) ? roomsData.filter((r) => r.active !== false) : []);
      }
      if (reservationsRes.ok) {
        const reservationsData = await reservationsRes.json();
        setReservations(Array.isArray(reservationsData) ? reservationsData : []);
      }
      if (customersRes.ok) {
        const customersData = await customersRes.json();
        setCustomers(Array.isArray(customersData) ? customersData : []);
      }

      setRoomStatus({ type: "success", message: "Pokoj byl uložen." });
      closeRoomEditor();
    } catch (err) {
      setRoomStatus({ type: "error", message: err.message || "Nepodařilo se uložit pokoj." });
    }
  }

  // Render hlavnich sekci: obsazenost, rezervace, pokoje, zamestnanci + modaly.
  return (
    <main className="dashboard-shell">
      <div className="dashboard-shell__glow" aria-hidden="true" />
      <button className="btn btn--secondary dashboard-logout-fixed" onClick={handleLogout} type="button">
        Odhlásit
      </button>

      <section className="dashboard-wrap">
        <DashboardHeader viewTitle={viewTitle} activeView={activeView} setActiveView={setActiveView} />

        {activeView === "occupancy" ? (
          <OccupancySection
            RANGE_OPTIONS={RANGE_OPTIONS}
            occupancyRange={occupancyRange}
            setOccupancyRange={setOccupancyRange}
            username={username}
            occupancySettingsOpen={occupancySettingsOpen}
            setOccupancySettingsOpen={setOccupancySettingsOpen}
            occupancyCapacityMode={occupancyCapacityMode}
            setOccupancyCapacityMode={setOccupancyCapacityMode}
            occupancyCapacityValue={occupancyCapacityValue}
            setOccupancyCapacityValue={setOccupancyCapacityValue}
            filteredOccupancyRooms={filteredOccupancyRooms}
            rooms={rooms}
            goPrevWeek={goPrevWeek}
            goPrevDay={goPrevDay}
            formatIsoDay={formatIsoDay}
            weekStart={weekStart}
            onWeekDateChange={onWeekDateChange}
            goNextDay={goNextDay}
            goNextWeek={goNextWeek}
            rangeHeadline={rangeHeadline}
            loading={loading}
            error={error}
            weekDays={weekDays}
            formatMonthLabel={formatMonthLabel}
            formatDayLabel={formatDayLabel}
            reservations={reservations}
            getCellOccupancy={getCellOccupancy}
            openCreateReservation={openCreateReservation}
            openReservationDetail={openReservationDetail}
          />
        ) : activeView === "reservations" ? (
          <ReservationsSection
            loading={loading}
            error={error}
            reservationFilters={reservationFilters}
            updateReservationFilter={updateReservationFilter}
            RESERVATION_STATUSES={RESERVATION_STATUSES}
            PAYMENT_STATUSES={PAYMENT_STATUSES}
            reservationSort={reservationSort}
            setReservationSort={setReservationSort}
            RESERVATION_SORT_FIELDS={RESERVATION_SORT_FIELDS}
            filteredReservations={filteredReservations}
            pagedReservations={pagedReservations}
            reservationPage={reservationPage}
            setReservationPage={setReservationPage}
            reservationTotalPages={reservationTotalPages}
            pageSize={RESERVATIONS_PAGE_SIZE}
            reservations={reservations}
            resetReservationFilters={resetReservationFilters}
            openReservationDetail={openReservationDetail}
            formatDate={formatDate}
            formatMoney={formatMoney}
          />
        ) : activeView === "rooms" ? (
          <RoomsSection
            canManageRooms={canManageRooms}
            openCreateRoom={openCreateRoom}
            loading={loading}
            error={error}
            rooms={rooms}
            formatMoney={formatMoney}
            openEditRoom={openEditRoom}
          />
        ) : activeView === "services" ? (
          <ServicesSection
            canManageServices={canManageServices}
            openCreateService={openCreateService}
            loading={loading}
            error={error}
            serviceStatus={serviceStatus}
            services={services}
            formatMoney={formatMoney}
            openEditService={openEditService}
            deleteService={deleteService}
          />
        ) : (
          <EmployeesSection
            canManageEmployees={canManageEmployees}
            openCreateEmployee={openCreateEmployee}
            loading={loading}
            error={error}
            employeeStatus={employeeStatus}
            employees={employees}
            openEditEmployee={openEditEmployee}
            deleteEmployee={deleteEmployee}
          />
        )}
      </section>

      {/* Modal: detail a editace existujici rezervace */}
      {selectedReservation ? (
        <div className="reservation-modal-backdrop" onClick={closeReservationDetail}>
          <section
            className="reservation-modal"
            onClick={(e) => e.stopPropagation()}
            aria-label="Detail rezervace"
          >
            <header className="reservation-modal__head">
              <h3>Detail rezervace #{selectedReservation.id}</h3>
              <button
                className="btn btn--secondary btn--compact"
                type="button"
                onClick={closeReservationDetail}
              >
                Zavřít
              </button>
            </header>

            {reservationEditMode ? (
              <>
                <div className="reservation-form-grid">
                  <label>
                    <span>Začátek rezervace</span>
                    <input
                      type="date"
                      value={reservationEditForm.checkInDate}
                      onChange={(e) => updateReservationEditForm("checkInDate", e.target.value)}
                    />
                  </label>
                  <label>
                    <span>Konec rezervace</span>
                    <input
                      type="date"
                      value={reservationEditForm.checkOutDate}
                      onChange={(e) => updateReservationEditForm("checkOutDate", e.target.value)}
                    />
                  </label>
                  <label>
                    <span>Počet hostů</span>
                    <input
                      type="number"
                      min={1}
                      max={selectedReservation.roomCapacity ?? 50}
                      value={reservationEditForm.numberOfGuests}
                      onChange={(e) => updateReservationEditForm("numberOfGuests", e.target.value)}
                    />
                  </label>
                  <label>
                    <span>Stav rezervace</span>
                    <select
                      value={reservationEditForm.status}
                      onChange={(e) => updateReservationEditForm("status", e.target.value)}
                    >
                      {RESERVATION_STATUSES.map((statusValue) => (
                        <option key={statusValue} value={statusValue}>
                          {statusValue}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Stav platby</span>
                    <select
                      value={reservationEditForm.paymentStatus}
                      onChange={(e) => updateReservationEditForm("paymentStatus", e.target.value)}
                    >
                      {PAYMENT_STATUSES.map((statusValue) => (
                        <option key={statusValue} value={statusValue}>
                          {statusValue}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="reservation-form-grid__full">
                    <span>Speciální požadavky</span>
                    <textarea
                      rows={2}
                      value={reservationEditForm.specialRequests}
                      onChange={(e) => updateReservationEditForm("specialRequests", e.target.value)}
                    />
                  </label>
                  <fieldset className="reservation-customer-box reservation-form-grid__full">
                    <legend>Doplňkové služby</legend>
                    {services.length === 0 ? (
                      <div className="customer-search-hint">Nejsou k dispozici žádné vytvořené služby.</div>
                    ) : (
                      <div className="new-customer-grid">
                        {services.map((service) => {
                          const selectedItem = normalizeServiceSelections(reservationEditForm.serviceItems).find(
                            (item) => item.serviceId === String(service.id)
                          );
                          return (
                            <label key={`edit-service-${service.id}`}>
                              <span>
                                <input
                                  type="checkbox"
                                  checked={!!selectedItem}
                                  onChange={(e) => toggleReservationService(service.id, e.target.checked)}
                                />
                                {" "}
                                {service.name} ({formatMoney(service.price)})
                              </span>
                              <input
                                type="number"
                                min={1}
                                value={selectedItem?.quantity ?? 1}
                                disabled={!selectedItem}
                                onChange={(e) => updateReservationServiceQuantity(service.id, e.target.value)}
                              />
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </fieldset>
                </div>

                {reservationActionStatus.message ? (
                  <p
                    className={`status status--${
                      reservationActionStatus.type === "idle" ? "neutral" : reservationActionStatus.type
                    }`}
                  >
                    {reservationActionStatus.message}
                  </p>
                ) : null}

                <div className="reservation-actions">
                  <button
                    className="btn btn--secondary"
                    type="button"
                    onClick={() => {
                      setReservationEditMode(false);
                      setReservationActionStatus({ type: "idle", message: "" });
                    }}
                  >
                    Zpět
                  </button>
                  <button className="btn btn--primary" type="button" onClick={submitReservationUpdate}>
                    Uložit změny
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="reservation-detail-sections">
                  <section className="reservation-detail-section">
                    {/*<h4>Terminy rezervace</h4>*/}
                    <div className="reservation-detail-grid">
                      <div className="reservation-detail-item">
                        <span className="reservation-detail-item__label">Vytvoření rezervace</span>
                        <span>{formatDateTime(selectedReservation.createdAt)}</span>
                      </div>
                      <div className="reservation-detail-item">
                        <span className="reservation-detail-item__label"> </span>
                        
                      </div>
                      <div className="reservation-detail-item">
                        <span className="reservation-detail-item__label">Od</span>
                        <span>{formatDate(selectedReservation.checkInDate)}</span>
                      </div>
                      <div className="reservation-detail-item">
                        <span className="reservation-detail-item__label">Do</span>
                        <span>{formatDate(selectedReservation.checkOutDate)}</span>
                      </div>
                      <div className="reservation-detail-item">
                        <span className="reservation-detail-item__label">Stav rezervace</span>
                        <select
                          value={reservationEditForm.status}
                          onChange={(e) => updateReservationEditForm("status", e.target.value)}
                        >
                          {RESERVATION_STATUSES.map((statusValue) => (
                            <option key={statusValue} value={statusValue}>
                              {statusValue}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="reservation-detail-item">
                        <span className="reservation-detail-item__label">Počet hostů</span>
                        <span>{selectedReservation.numberOfGuests ?? "-"}</span>
                      </div>
                      <div className="reservation-detail-item">
                        <span className="reservation-detail-item__label">Specialní požadavky</span>
                        <span>{selectedReservation.specialRequests || "-"}</span>
                      </div>
                    </div>
                  </section>

                  <section className="reservation-detail-section">
                    {/* <h4>Platba</h4> */}
                    <div className="reservation-detail-grid">
                      <div className="reservation-detail-item">
                        <span className="reservation-detail-item__label">Stav platby</span>
                        <select
                          value={reservationEditForm.paymentStatus}
                          onChange={(e) => updateReservationEditForm("paymentStatus", e.target.value)}
                        >
                          {PAYMENT_STATUSES.map((statusValue) => (
                            <option key={statusValue} value={statusValue}>
                              {statusValue}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="reservation-detail-item">
                        <span className="reservation-detail-item__label">Cena celkem</span>
                        <span>{formatMoney(selectedReservation.totalPrice)}</span>
                      </div>
                    </div>
                  </section>

                  <section className="reservation-detail-section">
                    <h4>Služby v rezervaci</h4>
                    <div className="reservation-detail-grid">
                      {Array.isArray(selectedReservation.serviceItems) && selectedReservation.serviceItems.length > 0 ? (
                        selectedReservation.serviceItems.map((item, index) => (
                          <div className="reservation-detail-item" key={`reservation-service-${item.id ?? index}`}>
                            <span className="reservation-detail-item__label">
                              {item.service?.name ?? `Služba #${item.service?.id ?? index + 1}`}
                            </span>
                            <span>
                              {item.quantity ?? 1}x {formatMoney(item.priceAtTime)} = {formatMoney(item.totalPrice)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="reservation-detail-item">
                          <span className="reservation-detail-item__label">Služby</span>
                          <span>Žádné doplňkové služby.</span>
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="reservation-detail-section">
                    {/* <h4>Pokoj</h4> */}
                    <div className="reservation-detail-grid">
                      <div className="reservation-detail-item">
                        <span className="reservation-detail-item__label">Pokoj</span>
                        <span>{selectedReservation.roomNumber ?? "-"}</span>
                      </div>
                      <div className="reservation-detail-item">
                        <span className="reservation-detail-item__label">Typ pokoje</span>
                        <span>{selectedReservation.roomType ?? "-"}</span>
                      </div>
                      <div className="reservation-detail-item">
                        <span className="reservation-detail-item__label">Kapacita pokoje</span>
                        <span>{selectedReservation.roomCapacity ?? "-"}</span>
                      </div>
                      <div className="reservation-detail-item">
                        <span className="reservation-detail-item__label">Cena za noc</span>
                        <span>{formatMoney(selectedReservation.roomPricePerNight)}</span>
                      </div>
                    </div>
                  </section>

                  <section className="reservation-detail-section">
                    {/* <h4>Zakaznik</h4> */}
                    <div className="reservation-detail-grid">
                      <div className="reservation-detail-item">
                        <span className="reservation-detail-item__label">Jméno zákazníka</span>
                        <span>{selectedReservation.customerName ?? "-"}</span>
                      </div>
                      <div className="reservation-detail-item">
                        <span className="reservation-detail-item__label">E-mail</span>
                        <span>{selectedReservation.customerEmail ?? "-"}</span>
                      </div>
                      <div className="reservation-detail-item">
                        <span className="reservation-detail-item__label">Telefon</span>
                        <span>{selectedReservation.customerPhone ?? "-"}</span>
                      </div>
                      <div className="reservation-detail-item">
                        <span className="reservation-detail-item__label">Datum narození</span>
                        <span>{formatDate(selectedReservation.customerDateOfBirth)}</span>
                      </div>
                      <div className="reservation-detail-item">
                        <span className="reservation-detail-item__label">Věk</span>
                        <span>{calculateAgeFromDate(selectedReservation.customerDateOfBirth) ?? "-"}</span>
                      </div>
                    </div>
                  </section>

                  <section className="reservation-detail-section">
                    <h4>Rezervaci vytvořil</h4>
                    <div className="reservation-detail-grid">
                      <div className="reservation-detail-item">
                        <span className="reservation-detail-item__label">Jméno zaměstnance</span>
                        <span>{selectedReservation.employeeName ?? "-"}</span>
                      </div>
                      <div className="reservation-detail-item">
                        <span className="reservation-detail-item__label">Uživatelské jméno</span>
                        <span>{selectedReservation.employeeUsername ?? "-"}</span>
                      </div>
                      <div className="reservation-detail-item">
                        <span className="reservation-detail-item__label">Role zaměstnance</span>
                        <span>{selectedReservation.employeeRole ?? "-"}</span>
                      </div>
                    </div>
                  </section>
                </div>

                {reservationActionStatus.message ? (
                  <p
                    className={`status status--${
                      reservationActionStatus.type === "idle" ? "neutral" : reservationActionStatus.type
                    }`}
                  >
                    {reservationActionStatus.message}
                  </p>
                ) : null}

                <div className="reservation-actions">
                  <button className="btn btn--primary" type="button" onClick={submitReservationStatusUpdate}>
                    Uložit stavy
                  </button>
                  <button
                    className="btn btn--secondary"
                    type="button"
                    onClick={() => {
                      setReservationEditMode(true);
                      setReservationActionStatus({ type: "idle", message: "" });
                    }}
                  >
                    Upravit
                  </button>
                  <button className="btn btn--danger" type="button" onClick={cancelReservation}>
                    Zrušit rezervaci
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      ) : null}

      {/* Modal: vytvoreni nove rezervace ze slotu v kalendari */}
      {createSlot ? (
        <div className="reservation-modal-backdrop" onClick={closeCreateReservation}>
          <section
            className="reservation-modal"
            onClick={(e) => e.stopPropagation()}
            aria-label="Vytvoření rezervace"
          >
            <header className="reservation-modal__head">
              <h3>Nová rezervace - pokoj {createSlot.room.number}</h3>
              <button className="btn btn--secondary btn--compact" type="button" onClick={closeCreateReservation}>
                Zavřít
              </button>
            </header>

            {createStep === "form" ? (
              <>
                <div className="reservation-form-grid">
                  <label>
                    <span>Začátek rezervace</span>
                    <input type="date" value={createSlot.startDateIso} disabled />
                  </label>

                <label>
                  <span>Konec rezervace</span>
                  <input
                    type="date"
                    value={createForm.checkOutDate}
                    min={formatIsoDay(addDays(parseLocalDate(createSlot.startDateIso), 1))}
                    onChange={(e) => updateCreateForm("checkOutDate", e.target.value)}
                  />
                </label>

                <label>
                  <span>Počet hostů</span>
                  <input
                    type="number"
                    min={1}
                    max={createSlot.room.capacity ?? 10}
                    value={createForm.numberOfGuests}
                    onChange={(e) => updateCreateForm("numberOfGuests", e.target.value)}
                  />
                </label>

                <label className="reservation-form-grid__full">
                  <span>Speciální požadavky</span>
                  <textarea
                    rows={2}
                    value={createForm.specialRequests}
                    onChange={(e) => updateCreateForm("specialRequests", e.target.value)}
                  />
                </label>

                <fieldset className="reservation-customer-box reservation-form-grid__full">
                  <legend>Doplňkové služby</legend>
                  {services.length === 0 ? (
                    <div className="customer-search-hint">Nejsou k dispozici žádné vytvořené služby.</div>
                  ) : (
                    <div className="new-customer-grid">
                      {services.map((service) => {
                        const selectedItem = normalizeServiceSelections(createForm.serviceItems).find(
                          (item) => item.serviceId === String(service.id)
                        );
                        return (
                          <label key={`create-service-${service.id}`}>
                            <span>
                              <input
                                type="checkbox"
                                checked={!!selectedItem}
                                onChange={(e) => toggleCreateService(service.id, e.target.checked)}
                              />
                              {" "}
                              {service.name} ({formatMoney(service.price)})
                            </span>
                            <input
                              type="number"
                              min={1}
                              value={selectedItem?.quantity ?? 1}
                              disabled={!selectedItem}
                              onChange={(e) => updateCreateServiceQuantity(service.id, e.target.value)}
                            />
                          </label>
                        );
                      })}
                    </div>
                  )}
                </fieldset>

                <fieldset className="reservation-customer-box reservation-form-grid__full">
                  <legend>Zákazník</legend>
                  <div className="customer-mode-row">
                    <label>
                      <input
                        type="radio"
                        name="customerMode"
                        checked={createForm.customerMode === "existing"}
                        onChange={() => updateCreateForm("customerMode", "existing")}
                      />
                      Existující zákazník
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="customerMode"
                        checked={createForm.customerMode === "new"}
                        onChange={() => updateCreateForm("customerMode", "new")}
                      />
                      Nový zákazník
                    </label>
                  </div>

                  {createForm.customerMode === "existing" ? (
                    <>
                      <label>
                        <span>Hledat zákazníka</span>
                        <input
                          type="text"
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          placeholder="Jméno, e-mail nebo telefon"
                        />
                      </label>
                      <label>
                        <span>Vyber zákazníka ({filteredCustomers.length})</span>
                        <select
                          value={createForm.existingCustomerId}
                          onChange={(e) => updateCreateForm("existingCustomerId", e.target.value)}
                        >
                          <option value="">-- Vyber --</option>
                          {filteredCustomers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.email ?? "-"} | {c.phone ?? "-"})
                            </option>
                          ))}
                        </select>
                      </label>
                      {customerSearch.trim() && filteredCustomers.length === 0 ? (
                        <div className="customer-search-hint">Pro zadaný dotaz nebyl nalezen žádný zákazník.</div>
                      ) : null}
                    </>
                  ) : (
                    <div className="new-customer-grid">
                      <label>
                        <span>Jméno</span>
                        <input
                          value={createForm.newCustomerName}
                          onChange={(e) => updateCreateForm("newCustomerName", e.target.value)}
                        />
                      </label>
                      <label>
                        <span>Datum narození</span>
                        <input
                          type="date"
                          value={createForm.newCustomerDateOfBirth}
                          onChange={(e) => updateCreateForm("newCustomerDateOfBirth", e.target.value)}
                        />
                      </label>
                      <label>
                        <span>E-mail</span>
                        <input
                          type="email"
                          value={createForm.newCustomerEmail}
                          onChange={(e) => updateCreateForm("newCustomerEmail", e.target.value)}
                        />
                      </label>
                      <label>
                        <span>Telefon</span>
                        <input
                          value={createForm.newCustomerPhone}
                          onChange={(e) => updateCreateForm("newCustomerPhone", e.target.value)}
                        />
                      </label>
                    </div>
                  )}
                </fieldset>

                  <div className="reservation-form-grid__full reservation-actions">
                    <button className="btn btn--secondary" type="button" onClick={closeCreateReservation}>
                      Zrušit
                    </button>
                    <button
                      className="btn btn--primary"
                      type="button"
                      onClick={() => {
                        const validationError = validateCreateForm();
                        if (validationError) {
                          setCreateStatus({ type: "error", message: validationError });
                          return;
                        }
                        setCreateStatus({ type: "idle", message: "" });
                        setCreateStep("confirm");
                      }}
                    >
                      Pokračovat na potvrzení
                    </button>
                  </div>
                </div>
                {createStatus.message ? (
                  <p className={`status status--${createStatus.type === "idle" ? "neutral" : createStatus.type}`}>
                    {createStatus.message}
                  </p>
                ) : null}
              </>
            ) : (
              <div className="reservation-confirm">
                <h4>Potvrzení rezervace</h4>
                <div className="reservation-grid">
                  <div><strong>Pokoj:</strong> {createSlot.room.number}</div>
                  <div><strong>Typ pokoje:</strong> {createSlot.room.type ?? "-"}</div>
                  <div><strong>Od:</strong> {formatDate(createSlot.startDateIso)}</div>
                  <div><strong>Do:</strong> {formatDate(createForm.checkOutDate)}</div>
                  <div><strong>Nocí:</strong> {createPreview?.nights ?? 0}</div>
                  <div><strong>Cena za noc:</strong> {formatMoney(createPreview?.roomPrice)}</div>
                  <div><strong>Pokoj celkem:</strong> {formatMoney(createPreview?.roomTotal)}</div>
                  <div><strong>Služby celkem:</strong> {formatMoney(createPreview?.servicesTotal)}</div>
                  <div><strong>Cena celkem:</strong> {formatMoney(createPreview?.total)}</div>
                  <div><strong>Hostů:</strong> {createForm.numberOfGuests}</div>
                  <div><strong>Zákazník:</strong> {createForm.customerMode === "existing"
                    ? (customers.find((c) => String(c.id) === String(createForm.existingCustomerId))?.name ?? "-")
                    : (createForm.newCustomerName || "-")}</div>
                  <div><strong>E-mail:</strong> {createForm.customerMode === "existing"
                    ? (customers.find((c) => String(c.id) === String(createForm.existingCustomerId))?.email ?? "-")
                    : (createForm.newCustomerEmail || "-")}</div>
                  <div><strong>Telefon:</strong> {createForm.customerMode === "existing"
                    ? (customers.find((c) => String(c.id) === String(createForm.existingCustomerId))?.phone ?? "-")
                    : (createForm.newCustomerPhone || "-")}</div>
                  <div className="reservation-form-grid__full"><strong>Poznámka:</strong> {createForm.specialRequests || "-"}</div>
                  <div className="reservation-form-grid__full">
                    <strong>Služby:</strong>{" "}
                    {normalizeServiceSelections(createForm.serviceItems).length > 0
                      ? normalizeServiceSelections(createForm.serviceItems).map((item) => {
                        const service = services.find((entry) => String(entry.id) === String(item.serviceId));
                        return `${service?.name ?? `#${item.serviceId}`} ${item.quantity}x`;
                      }).join(", ")
                      : "-"}
                  </div>
                </div>

                {createStatus.message ? (
                  <p className={`status status--${createStatus.type === "idle" ? "neutral" : createStatus.type}`}>
                    {createStatus.message}
                  </p>
                ) : null}

                <div className="reservation-actions">
                  <button className="btn btn--secondary" type="button" onClick={() => setCreateStep("form")}>
                    Zpět
                  </button>
                  <button
                    className="btn btn--primary"
                    type="button"
                    onClick={() => {
                      const validationError = validateCreateForm();
                      if (validationError) {
                        setCreateStatus({ type: "error", message: validationError });
                        return;
                      }
                      submitReservationCreate();
                    }}
                  >
                    Potvrdit rezervaci
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      ) : null}

      {serviceEditor ? (
        <div className="reservation-modal-backdrop" onClick={closeServiceEditor}>
          <section className="reservation-modal" onClick={(e) => e.stopPropagation()} aria-label="Správa služby">
            <header className="reservation-modal__head">
              <h3>{serviceEditor.mode === "create" ? "Přidat službu" : "Upravit službu"}</h3>
              <button className="btn btn--secondary btn--compact" type="button" onClick={closeServiceEditor}>
                Zavřít
              </button>
            </header>

            <div className="reservation-form-grid">
              <label>
                <span>Název služby</span>
                <input value={serviceForm.name} onChange={(e) => updateServiceForm("name", e.target.value)} />
              </label>
              <label>
                <span>Cena</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={serviceForm.price}
                  onChange={(e) => updateServiceForm("price", e.target.value)}
                />
              </label>
              <label className="reservation-form-grid__full">
                <span>Popis</span>
                <textarea
                  rows={3}
                  value={serviceForm.description}
                  onChange={(e) => updateServiceForm("description", e.target.value)}
                />
              </label>
            </div>

            {serviceStatus.message ? (
              <p className={`status status--${serviceStatus.type === "idle" ? "neutral" : serviceStatus.type}`}>
                {serviceStatus.message}
              </p>
            ) : null}

            <div className="reservation-actions">
              <button className="btn btn--secondary" type="button" onClick={closeServiceEditor}>
                Zrušit
              </button>
              <button className="btn btn--primary" type="button" onClick={submitServiceEditor}>
                Uložit službu
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {/* Modal: vytvoreni/editace pokoje */}
      {roomEditor ? (
        <div className="reservation-modal-backdrop" onClick={closeRoomEditor}>
          <section className="reservation-modal" onClick={(e) => e.stopPropagation()} aria-label="Správa pokoje">
            <header className="reservation-modal__head">
              <h3>{roomEditor.mode === "create" ? "Vytvořit nový pokoj" : "Upravit pokoj"}</h3>
              <button className="btn btn--secondary btn--compact" type="button" onClick={closeRoomEditor}>
                Zavřít
              </button>
            </header>

            <div className="reservation-form-grid">
              <label>
                <span>Číslo pokoje</span>
                <input value={roomForm.number} onChange={(e) => updateRoomForm("number", e.target.value)} />
              </label>
              <label>
                <span>Typ pokoje</span>
                <input value={roomForm.type} onChange={(e) => updateRoomForm("type", e.target.value)} />
              </label>
              <label>
                <span>Kapacita</span>
                <input
                  type="number"
                  min={1}
                  value={roomForm.capacity}
                  onChange={(e) => updateRoomForm("capacity", e.target.value)}
                />
              </label>
              <label>
                <span>Cena za noc</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={roomForm.pricePerNight}
                  onChange={(e) => updateRoomForm("pricePerNight", e.target.value)}
                />
              </label>

              {roomEditor.mode === "edit" ? (
                <label className="room-active-toggle reservation-form-grid__full">
                  <input
                    type="checkbox"
                    checked={roomForm.active}
                    onChange={(e) => updateRoomForm("active", e.target.checked)}
                  />
                  <span>Pokoj je aktivní</span>
                </label>
              ) : null}
            </div>

            {roomStatus.message ? (
              <p className={`status status--${roomStatus.type === "idle" ? "neutral" : roomStatus.type}`}>
                {roomStatus.message}
              </p>
            ) : null}

            <div className="reservation-actions">
              <button className="btn btn--secondary" type="button" onClick={closeRoomEditor}>
                Zrušit
              </button>
              <button className="btn btn--primary" type="button" onClick={submitRoomEditor}>
                Uložit pokoj
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {/* Modal: vytvoreni/editace zamestnance */}
      {employeeEditor ? (
        <div className="reservation-modal-backdrop" onClick={closeEmployeeEditor}>
          <section className="reservation-modal" onClick={(e) => e.stopPropagation()} aria-label="Správa zaměstnance">
            <header className="reservation-modal__head">
              <h3>{employeeEditor.mode === "create" ? "Přidat zaměstnance" : "Upravit zaměstnance"}</h3>
              <button className="btn btn--secondary btn--compact" type="button" onClick={closeEmployeeEditor}>
                Zavřít
              </button>
            </header>

            <div className="reservation-form-grid">
              <label>
                <span>Jméno</span>
                <input value={employeeForm.name} onChange={(e) => updateEmployeeForm("name", e.target.value)} />
              </label>
              <label>
                <span>Username</span>
                <input
                  value={employeeForm.username}
                  onChange={(e) => updateEmployeeForm("username", e.target.value)}
                />
              </label>
              <label>
                <span>Kontakt</span>
                <input value={employeeForm.contact} onChange={(e) => updateEmployeeForm("contact", e.target.value)} />
              </label>
              <label>
                <span>Role</span>
                <select value={employeeForm.role} onChange={(e) => updateEmployeeForm("role", e.target.value)}>
                  {EMPLOYEE_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>
              {employeeEditor.mode === "create" ? (
                <>
                  <label>
                    <span>Heslo</span>
                    <input
                      type="password"
                      value={employeeForm.password}
                      autoComplete="new-password"
                      onChange={(e) => updateEmployeeForm("password", e.target.value)}
                    />
                  </label>
                  <label>
                    <span>Potvrzení hesla</span>
                    <input
                      type="password"
                      value={employeeForm.passwordConfirm}
                      autoComplete="new-password"
                      onChange={(e) => updateEmployeeForm("passwordConfirm", e.target.value)}
                    />
                  </label>
                </>
              ) : null}
            </div>

            {employeeStatus.message ? (
              <p className={`status status--${employeeStatus.type === "idle" ? "neutral" : employeeStatus.type}`}>
                {employeeStatus.message}
              </p>
            ) : null}

            <div className="reservation-actions">
              {employeeEditor.mode === "edit" ? (
                <button className="btn btn--secondary" type="button" onClick={openEmployeePasswordEditor}>
                  Změnit heslo
                </button>
              ) : null}
              <button className="btn btn--primary" type="button" onClick={submitEmployeeEditor}>
                Uložit zaměstnance
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {employeePasswordEditor ? (
        <div className="reservation-modal-backdrop" onClick={closeEmployeePasswordEditor}>
          <section className="reservation-modal" onClick={(e) => e.stopPropagation()} aria-label="Změna hesla zaměstnance">
            <header className="reservation-modal__head">
              <h3>Změnit heslo: {employeePasswordEditor.username || `#${employeePasswordEditor.employeeId}`}</h3>
              <button className="btn btn--secondary btn--compact" type="button" onClick={closeEmployeePasswordEditor}>
                Zavřít
              </button>
            </header>

            <div className="reservation-form-grid">
              <label>
                <span>Nové heslo</span>
                <input
                  type="password"
                  value={employeePasswordForm.password}
                  autoComplete="new-password"
                  onChange={(e) => updateEmployeePasswordForm("password", e.target.value)}
                />
              </label>
              <label>
                <span>Potvrzení nového hesla</span>
                <input
                  type="password"
                  value={employeePasswordForm.passwordConfirm}
                  autoComplete="new-password"
                  onChange={(e) => updateEmployeePasswordForm("passwordConfirm", e.target.value)}
                />
              </label>
            </div>

            {employeePasswordStatus.message ? (
              <p
                className={`status status--${employeePasswordStatus.type === "idle" ? "neutral" : employeePasswordStatus.type}`}
              >
                {employeePasswordStatus.message}
              </p>
            ) : null}

            <div className="reservation-actions">
              <button className="btn btn--primary" type="button" onClick={submitEmployeePasswordChange}>
                Uložit nové heslo
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
