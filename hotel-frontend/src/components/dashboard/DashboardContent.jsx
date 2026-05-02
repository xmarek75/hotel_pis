import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import DashboardHeader from "./DashboardHeader";
import {
  DAYS_TO_SHOW,
  EMPLOYEE_ROLES,
  PAYMENT_STATUSES,
  RANGE_OPTIONS,
  RESERVATIONS_PAGE_SIZE,
  RESERVATION_SORT_FIELDS,
  RESERVATION_STATUSES,
} from "./dashboardConstants";
import {
  addDays,
  buildReservationServicePayload,
  calculateAgeFromDate,
  calculateSelectedServicesTotal,
  enrichReservation,
  formatDate,
  formatDayLabel,
  formatIsoDay,
  formatMoney,
  formatMonthLabel,
  formatRangeLabel,
  getCellOccupancy,
  getRoomServiceIds,
  getRoomTypeId,
  getRoomTypeName,
  formatRoomServices,
  mapReservationServiceItems,
  normalizeServiceSelections,
  parseLocalDate,
  startOfDay,
} from "./dashboardUtils";
import EmployeeEditorModal from "./modals/EmployeeEditorModal";
import EmployeePasswordEditorModal from "./modals/EmployeePasswordEditorModal";
import CustomerEditorModal from "./modals/CustomerEditorModal";
import ReservationCreateModal from "./modals/ReservationCreateModal";
import ReservationDetailModal from "./modals/ReservationDetailModal";
import RoomAmenityEditorModal from "./modals/RoomAmenityEditorModal";
import RoomEditorModal from "./modals/RoomEditorModal";
import ServiceEditorModal from "./modals/ServiceEditorModal";
import CustomersSection from "./sections/CustomersSection";
import OccupancySection from "./sections/OccupancySection";
import ReservationsSection from "./sections/ReservationsSection";
import RoomsSection from "./sections/RoomsSection";
import ServicesSection from "./sections/ServicesSection";
import EmployeesSection from "./sections/EmployeesSection";

const API_BASE = import.meta.env.DEV ? "/api" : "/hotel/api";

function apiUrl(path) {
  return `${API_BASE}${path}`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout, username, role, authHeader } = useAuth();

  // Centralni state dashboardu (data, filtry, modaly, formulare a status hlasky).
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [roomAmenities, setRoomAmenities] = useState([]);
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
  const [customerEditor, setCustomerEditor] = useState(null);
  const [customerForm, setCustomerForm] = useState({
    name: "",
    dateOfBirth: "",
    email: "",
    phone: "",
  });
  const [customerStatus, setCustomerStatus] = useState({ type: "idle", message: "" });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeView, setActiveView] = useState("occupancy");
  const [occupancyRange, setOccupancyRange] = useState("week");
  const [occupancySettingsOpen, setOccupancySettingsOpen] = useState(false);
  const [occupancyCapacityMode, setOccupancyCapacityMode] = useState("all");
  const [occupancyCapacityValue, setOccupancyCapacityValue] = useState("4");
  const [occupancyAmenityIds, setOccupancyAmenityIds] = useState([]);
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
    typeId: "",
    typeName: "",
    capacity: 2,
    pricePerNight: "",
    roomServiceIds: [],
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
  const [roomAmenityEditor, setRoomAmenityEditor] = useState(null);
  const [roomAmenityForm, setRoomAmenityForm] = useState({
    name: "",
    description: "",
  });
  const [roomAmenityStatus, setRoomAmenityStatus] = useState({ type: "idle", message: "" });
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
  const isReceptionist = role === "RECEPTIONIST";
  const canManageRooms = isAdmin;
  const canManageServices = isAdmin || isManager;
  const canManageCustomers = isAdmin || isReceptionist;
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
        const [roomsRes, reservationsRes, customersRes, servicesRes, roomTypesRes, roomAmenitiesRes] = await Promise.all([
          fetch(apiUrl("/rooms"), { headers }),
          fetch(apiUrl("/reservations"), { headers }),
          fetch(apiUrl("/customers"), { headers }),
          fetch(apiUrl("/services"), { headers }),
          fetch(apiUrl("/room-types"), { headers }),
          fetch(apiUrl("/room-amenities"), { headers }),
        ]);

        if (!roomsRes.ok) {
          throw new Error(`Načtení pokojů selhalo (${roomsRes.status})`);
        }
        if (!reservationsRes.ok) {
          throw new Error(`Načtení rezervací selhalo (${reservationsRes.status})`);
        }
        if (!customersRes.ok && customersRes.status !== 401 && customersRes.status !== 403) {
          throw new Error(`Načtení zákazníků selhalo (${customersRes.status})`);
        }
        if (!servicesRes.ok) {
          throw new Error(`Načtení služeb selhalo (${servicesRes.status})`);
        }
        if (!roomTypesRes.ok) {
          throw new Error(`Načtení typů pokojů selhalo (${roomTypesRes.status})`);
        }
        if (!roomAmenitiesRes.ok) {
          throw new Error(`Načtení vybavení pokojů selhalo (${roomAmenitiesRes.status})`);
        }

        const roomsData = await roomsRes.json();
        const reservationsData = await reservationsRes.json();
        const customersData = customersRes.ok ? await customersRes.json() : [];
        const servicesData = await servicesRes.json();
        const roomTypesData = await roomTypesRes.json();
        const roomAmenitiesData = await roomAmenitiesRes.json();

        const activeRooms = Array.isArray(roomsData)
          ? roomsData.filter((room) => room.active !== false)
          : [];
        const safeReservations = Array.isArray(reservationsData) ? reservationsData : [];
        const safeCustomers = Array.isArray(customersData) ? customersData : [];
        const safeServices = Array.isArray(servicesData) ? servicesData : [];
        const safeRoomTypes = Array.isArray(roomTypesData) ? roomTypesData : [];
        const safeRoomAmenities = Array.isArray(roomAmenitiesData) ? roomAmenitiesData : [];
        let safeEmployees = [];
        if (role === "administrator") {
          const employeesRes = await fetch(apiUrl("/employees"), { headers });
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
          setRoomTypes(safeRoomTypes);
          setRoomAmenities(safeRoomAmenities);
          setEmployees(safeEmployees);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Nepodařilo se načíst data.");
          setRooms([]);
          setReservations([]);
          setCustomers([]);
          setServices([]);
          setRoomTypes([]);
          setRoomAmenities([]);
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
    if (activeView === "customers") return "Správa zákazníků";
    return "Správa zaměstnanců";
  }, [activeView]);

  const filteredOccupancyRooms = useMemo(() => {
    return rooms.filter((room) => {
      if (occupancyCapacityMode !== "all") {
        const capacity = Number(room.capacity ?? 0);
        const limit = Number(occupancyCapacityValue);
        if (!Number.isFinite(capacity) || capacity <= 0) return false;
        if (!Number.isFinite(limit) || limit <= 0) {
          return true;
        }
        if (occupancyCapacityMode === "exact" && capacity !== limit) {
          return false;
        }
        if (occupancyCapacityMode === "min" && capacity < limit) {
          return false;
        }
      }

      if (occupancyAmenityIds.length > 0) {
        const roomServiceIds = getRoomServiceIds(room);
        const hasAllSelectedAmenities = occupancyAmenityIds.every((amenityId) =>
          roomServiceIds.includes(String(amenityId))
        );
        if (!hasAllSelectedAmenities) {
          return false;
        }
      }

      return true;
    });
  }, [rooms, occupancyCapacityMode, occupancyCapacityValue, occupancyAmenityIds]);

  const hydratedReservations = useMemo(
    () => reservations.map((reservation) => enrichReservation(reservation, rooms, customers, employees, services)),
    [reservations, rooms, customers, employees, services]
  );

  useEffect(() => {
    if (!selectedReservation?.id) return;
    const freshReservation = hydratedReservations.find(
      (reservation) => Number(reservation.id) === Number(selectedReservation.id)
    );
    if (freshReservation) {
      setSelectedReservation(freshReservation);
    }
  }, [hydratedReservations, selectedReservation?.id]);

  // Klientska filtrace a razeni seznamu rezervaci pro sekci "Sprava rezervaci".
  const filteredReservations = useMemo(() => {
    const normalizedSearch = reservationFilters.search.trim().toLowerCase();

    const filtered = hydratedReservations.filter((reservation) => {
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
  }, [hydratedReservations, reservationFilters, reservationSort]);

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
        const customerRes = await fetch(apiUrl("/customers"), {
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

      const reservationRes = await fetch(apiUrl("/reservations"), {
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
        fetch(apiUrl("/rooms"), { headers: { Authorization: authHeader, Accept: "application/json" } }),
        fetch(apiUrl("/reservations"), { headers: { Authorization: authHeader, Accept: "application/json" } }),
        fetch(apiUrl("/customers"), { headers: { Authorization: authHeader, Accept: "application/json" } }),
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
      const updateRes = await fetch(apiUrl(`/reservations/${selectedReservation.id}`), {
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
        fetch(apiUrl("/rooms"), { headers: { Authorization: authHeader, Accept: "application/json" } }),
        fetch(apiUrl("/reservations"), { headers: { Authorization: authHeader, Accept: "application/json" } }),
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
      const updateRes = await fetch(apiUrl(`/reservations/${selectedReservation.id}`), {
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

      const reservationsRes = await fetch(apiUrl("/reservations"), {
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
      const res = await fetch(apiUrl(`/reservations/${selectedReservation.id}`), {
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
        fetch(apiUrl("/rooms"), { headers: { Authorization: authHeader, Accept: "application/json" } }),
        fetch(apiUrl("/reservations"), { headers: { Authorization: authHeader, Accept: "application/json" } }),
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
      typeId: roomTypes[0]?.id != null ? String(roomTypes[0].id) : "",
      typeName: roomTypes[0]?.name ?? "",
      capacity: 2,
      pricePerNight: "",
      roomServiceIds: [],
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
    const servicesRes = await fetch(apiUrl("/services"), {
      headers: { Authorization: authHeader, Accept: "application/json" },
    });
    if (!servicesRes.ok) {
      throw new Error(`Načtení služeb selhalo (${servicesRes.status})`);
    }
    const servicesData = await servicesRes.json();
    setServices(Array.isArray(servicesData) ? servicesData : []);
  }

  async function refreshRoomAmenities() {
    const roomAmenitiesRes = await fetch(apiUrl("/room-amenities"), {
      headers: { Authorization: authHeader, Accept: "application/json" },
    });
    if (!roomAmenitiesRes.ok) {
      throw new Error(`Načtení vybavení pokojů selhalo (${roomAmenitiesRes.status})`);
    }
    const roomAmenitiesData = await roomAmenitiesRes.json();
    setRoomAmenities(Array.isArray(roomAmenitiesData) ? roomAmenitiesData : []);
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
      const url = isEdit ? apiUrl(`/services/${serviceEditor.serviceId}`) : apiUrl("/services");
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
      const res = await fetch(apiUrl(`/services/${service.id}`), {
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

  function openCreateRoomAmenity() {
    setRoomAmenityEditor({ mode: "create", serviceId: null });
    setRoomAmenityStatus({ type: "idle", message: "" });
    setRoomAmenityForm({
      name: "",
      description: "",
    });
  }

  function openEditRoomAmenity(service) {
    setRoomAmenityEditor({ mode: "edit", serviceId: service.id });
    setRoomAmenityStatus({ type: "idle", message: "" });
    setRoomAmenityForm({
      name: service.name ?? "",
      description: service.description ?? "",
    });
  }

  function closeRoomAmenityEditor() {
    setRoomAmenityEditor(null);
    setRoomAmenityStatus({ type: "idle", message: "" });
  }

  function updateRoomAmenityForm(field, value) {
    setRoomAmenityForm((prev) => ({ ...prev, [field]: value }));
  }

  function validateRoomAmenityForm() {
    if (!roomAmenityForm.name?.trim()) return "Název room service je povinný.";
    if (!roomAmenityForm.description?.trim()) return "Popis room service je povinný.";
    return "";
  }

  async function submitRoomAmenityEditor() {
    const validation = validateRoomAmenityForm();
    if (validation) {
      setRoomAmenityStatus({ type: "error", message: validation });
      return;
    }

    setRoomAmenityStatus({ type: "loading", message: "Ukládám room service..." });
    try {
      const payload = {
        name: roomAmenityForm.name.trim(),
        description: roomAmenityForm.description.trim(),
      };
      const headers = {
        Authorization: authHeader,
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      const isEdit = roomAmenityEditor?.mode === "edit" && roomAmenityEditor.serviceId != null;
      const url = isEdit
        ? apiUrl(`/room-amenities/${roomAmenityEditor.serviceId}`)
        : apiUrl("/room-amenities");
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Uložení room service selhalo (${res.status})${txt ? `: ${txt}` : ""}`);
      }

      await refreshRoomAmenities();
      setRoomAmenityStatus({ type: "success", message: "Room service byla uložena." });
      closeRoomAmenityEditor();
    } catch (err) {
      setRoomAmenityStatus({ type: "error", message: err.message || "Nepodařilo se uložit room service." });
    }
  }

  async function deleteRoomAmenity(service) {
    if (!service?.id) return;
    if (!window.confirm(`Opravdu chceš smazat room service ${service.name}?`)) {
      return;
    }

    setRoomAmenityStatus({ type: "loading", message: "Mažu room service..." });
    try {
      const res = await fetch(apiUrl(`/room-amenities/${service.id}`), {
        method: "DELETE",
        headers: {
          Authorization: authHeader,
          Accept: "application/json",
        },
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Smazání room service selhalo (${res.status})${txt ? `: ${txt}` : ""}`);
      }

      await refreshRoomAmenities();
      setRoomAmenityStatus({ type: "success", message: "Room service byla smazána." });
      setRoomForm((prev) => ({
        ...prev,
        roomServiceIds: (Array.isArray(prev.roomServiceIds) ? prev.roomServiceIds : []).filter(
          (id) => String(id) !== String(service.id)
        ),
      }));
    } catch (err) {
      setRoomAmenityStatus({ type: "error", message: err.message || "Nepodařilo se smazat room service." });
    }
  }

  function openEditRoom(room) {
    setRoomEditor({ mode: "edit", roomId: room.id });
    setRoomStatus({ type: "idle", message: "" });
    setRoomForm({
      number: room.number ?? "",
      typeId: getRoomTypeId(room),
      typeName: getRoomTypeName(room),
      capacity: room.capacity ?? 1,
      pricePerNight: room.pricePerNight ?? "",
      roomServiceIds: getRoomServiceIds(room),
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

  function toggleRoomAmenity(serviceId, enabled) {
    const normalizedId = String(serviceId);
    setRoomForm((prev) => {
      const current = Array.isArray(prev.roomServiceIds) ? prev.roomServiceIds.map(String) : [];
      const exists = current.includes(normalizedId);

      if (enabled && !exists) {
        return { ...prev, roomServiceIds: [...current, normalizedId] };
      }
      if (!enabled && exists) {
        return { ...prev, roomServiceIds: current.filter((id) => id !== normalizedId) };
      }
      return prev;
    });
  }

  function validateRoomForm() {
    if (!roomForm.number?.trim()) return "Číslo pokoje je povinné.";
    if (!roomForm.typeId && !roomForm.typeName?.trim()) return "Typ pokoje je povinný.";
    const capacity = Number(roomForm.capacity);
    if (!capacity || capacity <= 0) return "Kapacita musí být větší než 0.";
    const price = Number(roomForm.pricePerNight);
    if (Number.isNaN(price) || price < 0) return "Cena za noc musí být číslo >= 0.";
    return "";
  }

  function openCreateCustomer() {
    setCustomerEditor({ mode: "create", customerId: null });
    setCustomerStatus({ type: "idle", message: "" });
    setCustomerForm({
      name: "",
      dateOfBirth: "",
      email: "",
      phone: "",
    });
  }

  function openEditCustomer(customer) {
    setCustomerEditor({ mode: "edit", customerId: customer.id });
    setCustomerStatus({ type: "idle", message: "" });
    setCustomerForm({
      name: customer.name ?? "",
      dateOfBirth: customer.dateOfBirth ?? "",
      email: customer.email ?? "",
      phone: customer.phone ?? "",
    });
  }

  function closeCustomerEditor() {
    setCustomerEditor(null);
    setCustomerStatus({ type: "idle", message: "" });
  }

  function updateCustomerForm(field, value) {
    setCustomerForm((prev) => ({ ...prev, [field]: value }));
  }

  function validateCustomerForm() {
    if (!customerForm.name?.trim()) return "Jméno zákazníka je povinné.";
    if (!customerForm.dateOfBirth) return "Datum narození je povinné.";
    if (calculateAgeFromDate(customerForm.dateOfBirth) == null) return "Datum narození musí být platné.";
    if (!customerForm.phone?.trim()) return "Telefon je povinný.";
    return "";
  }

  async function refreshCustomers() {
    const customersRes = await fetch(apiUrl("/customers"), {
      headers: { Authorization: authHeader, Accept: "application/json" },
    });
    if (!customersRes.ok) {
      if (customersRes.status === 401 || customersRes.status === 403) {
        setCustomers([]);
        return;
      }
      throw new Error(`Načtení zákazníků selhalo (${customersRes.status})`);
    }
    const customersData = await customersRes.json();
    setCustomers(Array.isArray(customersData) ? customersData : []);
  }

  async function submitCustomerEditor() {
    const validation = validateCustomerForm();
    if (validation) {
      setCustomerStatus({ type: "error", message: validation });
      return;
    }

    setCustomerStatus({ type: "loading", message: "Ukládám zákazníka..." });
    try {
      const payload = {
        name: customerForm.name.trim(),
        dateOfBirth: customerForm.dateOfBirth,
        email: customerForm.email.trim(),
        phone: customerForm.phone.trim(),
      };
      const headers = {
        Authorization: authHeader,
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      const isEdit = customerEditor?.mode === "edit" && customerEditor.customerId != null;
      const url = isEdit ? apiUrl(`/customers/${customerEditor.customerId}`) : apiUrl("/customers");
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Uložení zákazníka selhalo (${res.status})${txt ? `: ${txt}` : ""}`);
      }

      await refreshCustomers();
      setCustomerStatus({ type: "success", message: "Zákazník byl uložen." });
      closeCustomerEditor();
    } catch (err) {
      setCustomerStatus({ type: "error", message: err.message || "Nepodařilo se uložit zákazníka." });
    }
  }

  async function deleteCustomer(customer) {
    if (!customer?.id) return;
    if (!window.confirm(`Opravdu chceš smazat zákazníka ${customer.name}?`)) {
      return;
    }

    setCustomerStatus({ type: "loading", message: "Mažu zákazníka..." });
    try {
      const res = await fetch(apiUrl(`/customers/${customer.id}`), {
        method: "DELETE",
        headers: {
          Authorization: authHeader,
          Accept: "application/json",
        },
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Smazání zákazníka selhalo (${res.status})${txt ? `: ${txt}` : ""}`);
      }

      await refreshCustomers();
      setCustomerStatus({ type: "success", message: "Zákazník byl smazán." });
    } catch (err) {
      setCustomerStatus({ type: "error", message: err.message || "Nepodařilo se smazat zákazníka." });
    }
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
    const employeesRes = await fetch(apiUrl("/employees"), {
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
      const url = isEdit ? apiUrl(`/employees/${employeeEditor.employeeId}`) : apiUrl("/employees");
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
      const res = await fetch(apiUrl(`/employees/${employee.id}`), {
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
      const res = await fetch(apiUrl(`/employees/${employeePasswordEditor.employeeId}`), {
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
      const selectedRoomType = roomTypes.find((type) => String(type.id) === String(roomForm.typeId));
      const payload = {
        number: roomForm.number.trim(),
        typeId: selectedRoomType?.id ?? null,
        typeName: selectedRoomType?.name ?? roomForm.typeName.trim(),
        capacity: Number(roomForm.capacity),
        pricePerNight: Number(roomForm.pricePerNight),
        roomServiceIds: (Array.isArray(roomForm.roomServiceIds) ? roomForm.roomServiceIds : []).map(Number),
      };
      const headers = {
        Authorization: authHeader,
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      const isEdit = roomEditor?.mode === "edit" && roomEditor.roomId != null;
      const url = isEdit ? apiUrl(`/rooms/${roomEditor.roomId}`) : apiUrl("/rooms");
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
        fetch(apiUrl("/rooms"), { headers: { Authorization: authHeader, Accept: "application/json" } }),
        fetch(apiUrl("/reservations"), { headers: { Authorization: authHeader, Accept: "application/json" } }),
        fetch(apiUrl("/customers"), { headers: { Authorization: authHeader, Accept: "application/json" } }),
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
            occupancyAmenityIds={occupancyAmenityIds}
            setOccupancyAmenityIds={setOccupancyAmenityIds}
            roomAmenities={roomAmenities}
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
            reservations={hydratedReservations}
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
            reservations={hydratedReservations}
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
            getRoomTypeName={getRoomTypeName}
            formatRoomServices={formatRoomServices}
            openEditRoom={openEditRoom}
          />
        ) : activeView === "services" ? (
          <ServicesSection
            canManageServices={canManageServices}
            openCreateService={openCreateService}
            openCreateRoomAmenity={openCreateRoomAmenity}
            loading={loading}
            error={error}
            serviceStatus={serviceStatus}
            roomAmenityStatus={roomAmenityStatus}
            services={services}
            roomAmenities={roomAmenities}
            formatMoney={formatMoney}
            openEditService={openEditService}
            deleteService={deleteService}
            openEditRoomAmenity={openEditRoomAmenity}
            deleteRoomAmenity={deleteRoomAmenity}
          />
        ) : activeView === "customers" ? (
          <CustomersSection
            canManageCustomers={canManageCustomers}
            openCreateCustomer={openCreateCustomer}
            loading={loading}
            error={error}
            customerStatus={customerStatus}
            customers={customers}
            formatDate={formatDate}
            calculateAgeFromDate={calculateAgeFromDate}
            openEditCustomer={openEditCustomer}
            deleteCustomer={deleteCustomer}
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

      <ReservationDetailModal
        selectedReservation={selectedReservation}
        closeReservationDetail={closeReservationDetail}
        reservationEditMode={reservationEditMode}
        setReservationEditMode={setReservationEditMode}
        reservationEditForm={reservationEditForm}
        updateReservationEditForm={updateReservationEditForm}
        reservationActionStatus={reservationActionStatus}
        services={services}
        toggleReservationService={toggleReservationService}
        updateReservationServiceQuantity={updateReservationServiceQuantity}
        RESERVATION_STATUSES={RESERVATION_STATUSES}
        PAYMENT_STATUSES={PAYMENT_STATUSES}
        submitReservationUpdate={submitReservationUpdate}
        submitReservationStatusUpdate={submitReservationStatusUpdate}
        cancelReservation={cancelReservation}
        setReservationActionStatus={setReservationActionStatus}
      />

      <ReservationCreateModal
        createSlot={createSlot}
        closeCreateReservation={closeCreateReservation}
        createStep={createStep}
        createStatus={createStatus}
        createForm={createForm}
        updateCreateForm={updateCreateForm}
        services={services}
        toggleCreateService={toggleCreateService}
        updateCreateServiceQuantity={updateCreateServiceQuantity}
        customerSearch={customerSearch}
        setCustomerSearch={setCustomerSearch}
        filteredCustomers={filteredCustomers}
        validateCreateForm={validateCreateForm}
        setCreateStatus={setCreateStatus}
        setCreateStep={setCreateStep}
        submitReservationCreate={submitReservationCreate}
        createPreview={createPreview}
        customers={customers}
      />

      <ServiceEditorModal
        serviceEditor={serviceEditor}
        serviceForm={serviceForm}
        serviceStatus={serviceStatus}
        updateServiceForm={updateServiceForm}
        closeServiceEditor={closeServiceEditor}
        submitServiceEditor={submitServiceEditor}
      />

      <RoomAmenityEditorModal
        roomAmenityEditor={roomAmenityEditor}
        roomAmenityForm={roomAmenityForm}
        roomAmenityStatus={roomAmenityStatus}
        updateRoomAmenityForm={updateRoomAmenityForm}
        closeRoomAmenityEditor={closeRoomAmenityEditor}
        submitRoomAmenityEditor={submitRoomAmenityEditor}
      />

      <RoomEditorModal
        roomEditor={roomEditor}
        roomForm={roomForm}
        roomStatus={roomStatus}
        closeRoomEditor={closeRoomEditor}
        updateRoomForm={updateRoomForm}
        roomTypes={roomTypes}
        setRoomForm={setRoomForm}
        roomAmenities={roomAmenities}
        toggleRoomAmenity={toggleRoomAmenity}
        submitRoomEditor={submitRoomEditor}
      />

      <CustomerEditorModal
        customerEditor={customerEditor}
        customerForm={customerForm}
        customerStatus={customerStatus}
        closeCustomerEditor={closeCustomerEditor}
        updateCustomerForm={updateCustomerForm}
        submitCustomerEditor={submitCustomerEditor}
      />

      <EmployeeEditorModal
        employeeEditor={employeeEditor}
        employeeForm={employeeForm}
        employeeStatus={employeeStatus}
        closeEmployeeEditor={closeEmployeeEditor}
        updateEmployeeForm={updateEmployeeForm}
        EMPLOYEE_ROLES={EMPLOYEE_ROLES}
        openEmployeePasswordEditor={openEmployeePasswordEditor}
        submitEmployeeEditor={submitEmployeeEditor}
      />

      <EmployeePasswordEditorModal
        employeePasswordEditor={employeePasswordEditor}
        employeePasswordForm={employeePasswordForm}
        employeePasswordStatus={employeePasswordStatus}
        closeEmployeePasswordEditor={closeEmployeePasswordEditor}
        updateEmployeePasswordForm={updateEmployeePasswordForm}
        submitEmployeePasswordChange={submitEmployeePasswordChange}
      />
    </main>
  );
}
