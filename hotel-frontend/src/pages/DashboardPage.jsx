import { useMemo, useState } from "react";
import { DAYS_TO_SHOW, RANGE_OPTIONS } from "../components/dashboard/dashboardConstants";
import { useAuth } from "../auth/AuthContext";
import { addDays, formatDayLabel, formatIsoDay, formatMonthLabel, formatRangeLabel, getCellOccupancy, getRoomServiceIds, startOfDay } from "../components/dashboard/dashboardUtils";
import { useRoomAmenities, useRooms } from "../queries/useRooms";
import { useReservations } from "../queries/useReservations";
import DashboardModal from "../components/modals/DashboardModal";

export default function DashboardPage() {
  const { username } = useAuth();

  const { data: rooms, isLoading, error } = useRooms();
  const { data: reservations } = useReservations();
  const { data: roomAmenities } = useRoomAmenities();

  const [occupancyRange, setOccupancyRange] = useState("week");
  const [occupancySettingsOpen, setOccupancySettingsOpen] = useState(false);
  const [occupancyCapacityMode, setOccupancyCapacityMode] = useState("all");
  const [occupancyCapacityValue, setOccupancyCapacityValue] = useState("4");
  const [weekStart, setWeekStart] = useState(() => startOfDay(new Date()));
  const [occupancyAmenityIds, setOccupancyAmenityIds] = useState([]);

  const [activeModal, setActiveModal] = useState({ type: null, data: null });
  
  const openModal = (type, data = null) => setActiveModal({ type, data });
  const closeModal = () => setActiveModal({ type: null, data: null });

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

  function toggleAmenity(serviceId, enabled) {
    const normalizedId = String(serviceId);
    const current = Array.isArray(occupancyAmenityIds) ? occupancyAmenityIds.map(String) : [];
    const exists = current.includes(normalizedId);

    if (enabled && !exists) {
      setOccupancyAmenityIds([...current, normalizedId]);
      return;
    }
    if (!enabled && exists) {
      setOccupancyAmenityIds(current.filter((id) => id !== normalizedId));
    }
  }

  const filteredOccupancyRooms = useMemo(() => {
    if (!rooms) return [];
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

  return (
    <section className="panel panel--wide">
      <div className="occupancy-head">
        <div className="occupancy-head__summary">
          <h2 className="panel__title">{RANGE_OPTIONS[occupancyRange].label} přehled pokojů</h2>
          <p className="panel__text">
            Přihlášený uživatel: <strong>{username}</strong>
          </p>
        </div>

        <div className="week-controls-wrap">
          <div className="range-switch-row">
            <div className="range-switch" role="group" aria-label="Rozsah přehledu">
              {Object.entries(RANGE_OPTIONS).map(([key, option]) => (
                <button
                  key={key}
                  type="button"
                  className={`range-switch__item ${occupancyRange === key ? "is-active" : ""}`}
                  onClick={() => setOccupancyRange(key)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="occupancy-settings">
              <button
                className="btn btn--secondary occupancy-settings__toggle"
                type="button"
                aria-label="Nastavení zobrazení pokojů"
                aria-expanded={occupancySettingsOpen}
                onClick={() => setOccupancySettingsOpen((prev) => !prev)}
              >
                ⚙
              </button>
              {occupancySettingsOpen ? (
                <section
                  className="occupancy-settings__popup"
                  aria-label="Nastavení zobrazení pokojů"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h4>Nastavení pokojů</h4>
                  <label>
                    <span>Filtr kapacity</span>
                    <select
                      value={occupancyCapacityMode}
                      onChange={(e) => setOccupancyCapacityMode(e.target.value)}
                    >
                      <option value="all">Všechny pokoje</option>
                      <option value="exact">Pouze přesná kapacita</option>
                      <option value="min">Kapacita od hodnoty</option>
                    </select>
                  </label>
                  {occupancyCapacityMode !== "all" ? (
                    <label>
                      <span>Kapacita</span>
                      <input
                        type="number"
                        min={1}
                        value={occupancyCapacityValue}
                        onChange={(e) => setOccupancyCapacityValue(e.target.value)}
                      />
                    </label>
                  ) : null}
                  <fieldset className="reservation-customer-box">
                    <legend>Vybavení pokoje</legend>
                    {roomAmenities.length === 0 ? (
                      <div className="customer-search-hint">Nejsou dostupné žádné room services.</div>
                    ) : (
                      <div className="new-customer-grid">
                        {roomAmenities.map((service) => {
                          const checked = (Array.isArray(occupancyAmenityIds) ? occupancyAmenityIds : [])
                            .map(String)
                            .includes(String(service.id));
                          return (
                            <label key={`occupancy-amenity-${service.id}`}>
                              <span>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => toggleAmenity(service.id, e.target.checked)}
                                />
                                {" "}
                                {service.name}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </fieldset>
                  <p className="occupancy-settings__hint">
                    Zobrazeno {filteredOccupancyRooms.length} z {rooms.length} pokojů.
                  </p>
                </section>
              ) : null}
            </div>
          </div>

          <div className="week-controls">
            <button className="btn btn--secondary btn--compact" type="button" onClick={goPrevWeek}>
              -týden
            </button>
            <button className="btn btn--secondary btn--compact" type="button" onClick={goPrevDay}>
              -1 den
            </button>
            <label className="week-picker" aria-label="Výběr počátečního dne přehledu">
              <input
                aria-label="Datum začátku zobrazení"
                type="date"
                value={formatIsoDay(weekStart)}
                onChange={onWeekDateChange}
              />
            </label>
            <button className="btn btn--secondary btn--compact" type="button" onClick={goNextDay}>
              +1 den
            </button>
            <button className="btn btn--secondary btn--compact" type="button" onClick={goNextWeek}>
              +týden
            </button>
          </div>
        </div>
      </div>
      <p className="week-range">{rangeHeadline}</p>
      
      {occupancyCapacityMode !== "all" && (
        <p className="occupancy-note">
          Filtr pokojů: {occupancyCapacityMode === "exact" ? "kapacita přesně" : "kapacita minimálně"}{" "}
          {Number(occupancyCapacityValue) > 0 ? occupancyCapacityValue : "-"}.
        </p>
      )}
      
      {occupancyAmenityIds.length > 0 && (
        <p className="occupancy-note">
          Filtr vybavení: {roomAmenities
            .filter((service) => occupancyAmenityIds.map(String).includes(String(service.id)))
            .map((service) => service.name)
            .join(", ")}.
        </p>
      )}

      {isLoading && <p className="panel__text">Načítám pokoje...</p>}
      {error && <p className="status status--error">{error.message}</p>}

      {(!isLoading && !error && rooms) && (
        <>
          <div className={`occupancy-wrap ${occupancyRange === "month" ? "is-month" : ""}`}>
            <table className={`occupancy-table ${occupancyRange === "month" ? "occupancy-table--month" : ""}`}>
              <thead>
                <tr>
                  <th scope="col">Pokoj</th>
                  <th scope="col">{occupancyRange === "month" ? "Kap." : "Kapacita"}</th>
                  {weekDays.map((day) => (
                    <th scope="col" key={formatIsoDay(day)}>
                      {occupancyRange === "month" ? (
                        <span className="day-head-two-line">
                          <span>{formatMonthLabel(day)}</span>
                          <span>{formatDayLabel(day, occupancyRange)}</span>
                        </span>
                      ) : (
                        formatDayLabel(day, occupancyRange)
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOccupancyRooms.length === 0 ? (
                  <tr>
                    <td colSpan={weekDays.length + 2} className="occupancy-empty">
                      {rooms.length === 0 ? "Žádné aktivní pokoje." : "Filtru neodpovídá žádný pokoj."}
                    </td>
                  </tr>
                ) : (
                  filteredOccupancyRooms.map((room) => (
                    <tr key={room.id ?? room.number}>
                      <th scope="row">č.{room.number}</th>
                      <td>{room.capacity ?? "-"}</td>
                      {weekDays.map((day) => {
                        const { state, reservation } = getCellOccupancy(room, day, reservations ?? []);
                        const openCreateFromCell = state === "free" || state === "departure";
                        const compactLabel = occupancyRange === "month";
                        const cellClass =
                          state === "reserved"
                            ? "cell-reserved"
                            : state === "arrival"
                              ? "cell-arrival"
                              : state === "departure"
                                ? "cell-departure"
                                : state === "turnover"
                                  ? "cell-turnover"
                                  : "cell-free";
                        const cellLabel = compactLabel
                          ? state === "reserved"
                            ? "O"
                            : state === "arrival"
                              ? "V/O"
                              : state === "departure"
                                ? "O/V"
                                : state === "turnover"
                                  ? "O"
                                  : "V"
                          : state === "reserved"
                            ? "Obsazeno"
                            : state === "arrival"
                              ? "Příjezd"
                              : state === "departure"
                                ? "Odjezd"
                                : state === "turnover"
                                  ? "Výměna"
                                  : "Volné";
                        const cellTitle =
                          state === "reserved"
                            ? "Obsazeno celý den - klikni pro detail"
                            : state === "arrival"
                              ? "Příjezd (ranní část dne volná) - klikni pro detail"
                              : state === "departure"
                                ? "Odjezd (odpolední část dne volná) - klikni pro vytvoření rezervace"
                                : state === "turnover"
                                  ? "Odjezd + příjezd v jednom dni - klikni pro detail"
                                  : "Volné - klikni pro vytvoření rezervace";
                        return (
                          <td
                            key={`${room.id ?? room.number}-${formatIsoDay(day)}`}
                            className={cellClass}
                            title={cellTitle}
                            role="button"
                            tabIndex={0}
                            onClick={
                              openCreateFromCell
                                ? () => openModal("CREATE", {room, day})
                                : () => openModal("DETAIL", {reservation})
                            }
                            // onKeyDown={(e) => {
                            //   if (e.key === "Enter" || e.key === " ") {
                            //     e.preventDefault();
                            //     if (openCreateFromCell) {
                            //       openCreateReservation(room, day);
                            //     } else {
                            //       openReservationDetail(reservation);
                            //     }
                            //   }
                            // }}
                          >
                            {cellLabel}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="occupancy-legend">
            <span className="legend-item">
              <i className="legend-swatch legend-swatch--free" />
              Volné
            </span>
            <span className="legend-item">
              <i className="legend-swatch legend-swatch--reserved" />
              Rezervováno
            </span>
            <span className="legend-item">
              <i className="legend-swatch legend-swatch--arrival" />
              Příjezd (V/O)
            </span>
            <span className="legend-item">
              <i className="legend-swatch legend-swatch--departure" />
              Odjezd (O/V)
            </span>
            <span className="legend-item">
              <i className="legend-swatch legend-swatch--turnover" />
              Výměna
            </span>
          </div>

          {activeModal.type === 'CREATE' && (
            <DashboardModal
              onClose={closeModal}
              createSlot={{
                room: activeModal.data.room, 
                day: activeModal.data.day, 
                startDateIso: formatIsoDay(activeModal.data.day)
              }}
            />
          )}
        </>
      )}
    </section>
  );
}