import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Fix default marker issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const MapView = ({ pins }) => {
  const defaultCenter = [7.8731, 80.7718]; // Sri Lanka center

  return (
    <div style={{ height: "400px", borderRadius: "16px", overflow: "hidden" }}>
      <MapContainer center={defaultCenter} zoom={7} style={{ height: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {pins.map((pin, index) => (
          <Marker key={index} position={[pin.lat, pin.lng]}>
            <Popup>
              <strong>{pin.name}</strong>
              <br />
              Students: {pin.count}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;