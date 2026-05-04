import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useDeleteService, useServices } from "../queries/useServices";
import { formatMoney } from "../components/dashboard/dashboardUtils";
import { useDeleteRoomAmenity, useRoomAmenities } from "../queries/useRooms";
import ServiceModal from "../components/modals/ServiceModal";
import RoomAmenityModal from "../components/modals/RoomAmenityModal";

export default function ServicePage() {
  const { role } = useAuth();

  const { data: services, isLoading: SIsLoading, error: serviceError } = useServices();
  const { data: roomAmenities, isLoading: RAIsLoading, error: RAError } = useRoomAmenities();
  const { mutate: deleteService, isPending: isDeleteServicePending, error: deleteServiceError } = useDeleteService();
  const { mutate: deleteAmenity, isPending: isDeleteAmenityPending, error: deleteAmenityError } = useDeleteRoomAmenity();
  
  const [activeModal, setActiveModal] = useState({ type: null, data: null });
  
  const openModal = (type, data = null) => setActiveModal({ type, data });
  const closeModal = () => setActiveModal({ type: null, data: null });

  const canManageServices = useMemo(() => role.toUpperCase() === "ADMINISTRATOR", [role]);

  return (
    <section className="panel panel--wide">
      <section className="rooms-admin rooms-admin--standalone">
        <div className="rooms-admin__head">
          <h3>Extra služby k rezervaci</h3>
          {canManageServices ? (
            <button className="btn btn--primary btn--compact" type="button" onClick={() => openModal("SERVICE")}>
              Přidat extra službu
            </button>
          ) : (
            <span className="rooms-admin__note">Správu služeb má dostupnou admin nebo manager účet.</span>
          )}
        </div>

        {SIsLoading && <p className="panel__text">Načítám služby...</p>}
        {serviceError && <p className="status status--error">{serviceError.message}</p>}
        {deleteServiceError && <p className="status status--error">{deleteServiceError.message}</p>}

        {(!SIsLoading && !serviceError && services) && (
          <div className="rooms-admin__table-wrap">
            <table className="rooms-admin__table">
              <thead>
                <tr>
                  <th>Název</th>
                  <th>Popis</th>
                  <th>Cena</th>
                  <th aria-label="Akce" />
                </tr>
              </thead>
              <tbody>
                {services.length === 0 ? (
                  <tr>
                    <td colSpan={4}>Žádné služby.</td>
                  </tr>
                ) : (
                  services.map((service) => (
                    <tr key={`manage-service-${service.id}`}>
                      <td>{service.name ?? "-"}</td>
                      <td>{service.description ?? "-"}</td>
                      <td>{formatMoney(service.price)}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="btn btn--secondary btn--compact"
                            type="button"
                            disabled={!canManageServices}
                            onClick={() => openModal("SERVICE", service)}
                          >
                            Upravit
                          </button>
                          <button
                            className="btn btn--danger btn--compact"
                            type="button"
                            disabled={!canManageServices || isDeleteServicePending}
                            onClick={() => deleteService(service.id)}
                          >
                            Smazat
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rooms-admin rooms-admin--standalone" style={{ marginTop: "1.5rem" }}>
        <div className="rooms-admin__head">
          <h3>Vybavení pokoje</h3>
          {canManageServices ? (
            <button className="btn btn--primary btn--compact" type="button" onClick={() => openModal("AMENITY")}>
              Přidat vybavení pokoje
            </button>
          ) : (
            <span className="rooms-admin__note">Správu room services má dostupnou admin nebo manager účet.</span>
          )}
        </div>

        {RAIsLoading && <p className="panel__text">Načítám vybavení pokojů...</p>}
        {RAError && <p className="status status--error">{RAError.message}</p>}
        {deleteAmenityError && <p className="status status--error">{deleteAmenityError.message}</p>}

        {(!RAIsLoading && !RAError && roomAmenities) && (
          <div className="rooms-admin__table-wrap">
            <table className="rooms-admin__table">
              <thead>
                <tr>
                  <th>Název</th>
                  <th>Popis</th>
                  <th aria-label="Akce" />
                </tr>
              </thead>
              <tbody>
                {roomAmenities.length === 0 ? (
                  <tr>
                    <td colSpan={3}>Žádné vybavení pokojů.</td>
                  </tr>
                ) : (
                  roomAmenities.map((amenity) => (
                    <tr key={`manage-room-amenity-${amenity.id}`}>
                      <td>{amenity.name ?? "-"}</td>
                      <td>{amenity.description ?? "-"}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="btn btn--secondary btn--compact"
                            type="button"
                            disabled={!canManageServices}
                            onClick={() => openModal("AMENITY", amenity)}
                          >
                            Upravit
                          </button>
                          <button
                            className="btn btn--danger btn--compact"
                            type="button"
                            disabled={!canManageServices || isDeleteAmenityPending}
                            onClick={() => deleteAmenity(amenity.id)}
                          >
                            Smazat
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {activeModal.type === 'SERVICE' && (
        <ServiceModal 
          key={activeModal.data?.id || 'new-service'}
          onClose={closeModal}
          serviceId={activeModal.data?.id}
        />
      )}

      {activeModal.type === 'AMENITY' && (
        <RoomAmenityModal 
          key={activeModal.data?.id || 'new-amenity'}
          onClose={closeModal}
          amenityId={activeModal.data?.id}
        />
      )}

    </section>
  );
}