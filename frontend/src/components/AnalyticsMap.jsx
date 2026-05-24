import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";

export default function AnalyticsMap({ pins = [] }) {
  const sriLankaCenter = [7.8731, 80.7718];

  const safePins = Array.isArray(pins)
    ? pins.filter(
        (pin) =>
          pin &&
          typeof pin.lat === "number" &&
          typeof pin.lng === "number" &&
          !Number.isNaN(pin.lat) &&
          !Number.isNaN(pin.lng)
      )
    : [];

  return (
    <div style={styles.wrapper}>
      <MapContainer
        center={sriLankaCenter}
        zoom={7}
        scrollWheelZoom={true}
        style={styles.map}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {safePins.map((pin, index) => {
          const radius = Math.max(8, Math.min((pin.count || 1) * 2, 22));

          return (
            <CircleMarker
              key={`${pin.name || "pin"}-${index}`}
              center={[pin.lat, pin.lng]}
              radius={radius}
              pathOptions={styles.marker}
            >
              <Popup>
                <div style={styles.popup}>
                  <div style={styles.popupTitle}>{pin.name || "Unknown Area"}</div>
                  <div style={styles.popupRow}>
                    <strong>Students:</strong> {pin.count ?? 0}
                  </div>
                  {pin.program && (
                    <div style={styles.popupRow}>
                      <strong>Program:</strong> {pin.program}
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}

const styles = {
  wrapper: {
    width: "100%",
    height: "520px",
    borderRadius: "22px",
    overflow: "hidden",
    border: "1px solid #e5e7eb",
    boxShadow: "0 14px 30px rgba(15,23,42,0.08)",
    background: "#ffffff",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  marker: {
    color: "#1d4ed8",
    fillColor: "#2563eb",
    fillOpacity: 0.72,
    weight: 2,
  },
  popup: {
    minWidth: "140px",
    lineHeight: 1.6,
    color: "#0f172a",
  },
  popupTitle: {
    fontSize: "1rem",
    fontWeight: 800,
    marginBottom: "8px",
  },
  popupRow: {
    fontSize: "0.92rem",
    color: "#334155",
  },
};