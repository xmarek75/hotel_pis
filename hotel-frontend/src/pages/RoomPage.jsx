import React, { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { formatMoney, formatRoomServices, getRoomTypeName } from "../components/dashboard/dashboardUtils";
import { useRooms } from "../queries/useRooms";
import RoomModal from "../components/dashboard/modals/RoomModal";

export default function RoomPage() {
  const { role } = useAuth();
  
  const { data: rooms, isLoading, error } = useRooms();

  const [activeModal, setActiveModal] = useState({ type: null, data: null });

  const openModal = (type, data = null) => setActiveModal({ type, data });
  const closeModal = () => setActiveModal({ type: null, data: null });

  const canManageRooms = useMemo(() => role.toUpperCase() === "ADMINISTRATOR", [role]);

  return (
    <section className="panel panel--wide">
      <section className="rooms-admin rooms-admin--standalone">
        <div className="rooms-admin__head">
          <h3>Správa pokojů</h3>
          {canManageRooms ? (
            <button className="btn btn--primary btn--compact" type="button" onClick={() => openModal("ROOM")}>
              Vytvořit nový pokoj
            </button>
          ) : (
            <span className="rooms-admin__note">Editaci pokojů má dostupnou účet admin.</span>
          )}
        </div>

        {isLoading ? <p className="panel__text">Načítám pokoje...</p> : null}
        {error ? <p className="status status--error">{error.message}</p> : null}

        {(!isLoading && !error && rooms) && (
          <div className="rooms-admin__table-wrap">
            <table className="rooms-admin__table">
              <thead>
                <tr>
                  <th>Číslo</th>
                  <th>Typ</th>
                  <th>Kapacita</th>
                  <th>Cena / noc</th>
                  <th>Vybavení</th>
                  <th aria-label="Úprava pokoje" />
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={`manage-${room.id}`}>
                    <td>{room.number}</td>
                    <td>{getRoomTypeName(room) || "-"}</td>
                    <td>{room.capacity}</td>
                    <td>{formatMoney(room.pricePerNight)}</td>
                    <td>{formatRoomServices(room)}</td>
                    <td>
                      <button
                        className="btn btn--secondary btn--compact"
                        type="button"
                        disabled={!canManageRooms}
                        onClick={() => openModal("ROOM", room)}
                      >
                        Upravit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeModal.type === 'ROOM' && (
          <RoomModal 
            key={activeModal.data?.id || 'new-room'}
            onClose={closeModal}
            roomId={activeModal.data?.id}
          />
        )}

      </section>
    </section>
  );
}
