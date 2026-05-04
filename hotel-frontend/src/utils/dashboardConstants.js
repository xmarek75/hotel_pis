export const DAYS_TO_SHOW = 7;
export const RESERVATIONS_PAGE_SIZE = 40;

export const RANGE_OPTIONS = {
  week: { label: "Týdenní", days: 7 },
  tenDays: { label: "10denní", days: 10 },
  month: { label: "Měsíční", days: 30 },
};

export const RESERVATION_STATUSES = ["PENDING", "CHECKED_IN", "CHECKED_OUT", "CANCELED"];
export const PAYMENT_STATUSES = ["UNPAID", "PARTIALLY_PAID", "PAID", "REFUNDED"];

export const RESERVATION_SORT_FIELDS = [
  { value: "id", label: "ID" },
  { value: "roomNumber", label: "Pokoj" },
  { value: "customerName", label: "Zakaznik" },
  { value: "checkInDate", label: "Od" },
  { value: "checkOutDate", label: "Do" },
  { value: "status", label: "Stav rezervace" },
  { value: "paymentStatus", label: "Stav platby" },
  { value: "totalPrice", label: "Cena" },
];

export const EMPLOYEE_ROLES = [
  { value: "RECEPTIONIST", label: "Recepční" }, 
  { value: "MANAGER", label: "Manažer" }, 
  { value: "ADMINISTRATOR", label: "Administrátor" },
];
