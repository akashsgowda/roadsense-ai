import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { getPotholes, updateStatus, upvotePothole } from "../services/api";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.heat";

const severityColor = {
  CRITICAL: "#ef4444", critical: "#ef4444",
  HIGH: "#f97316", high: "#f97316",
  MEDIUM: "#eab308", medium: "#eab308",
  LOW: "#22c55e", low: "#22c55e",
};

const statusColor = {
  fixed: "#22c55e",
  in_progress: "#3b82f6",
  under_review: "#f59e0b",
  reported: null,
};

const severityHeatWeight = { CRITICAL: 1.0, critical: 1.0, HIGH: 0.75, high: 0.75, MEDIUM: 0.5, medium: 0.5, LOW: 0.25, low: 0.25 };

const fetchTrafficIncidents = async () => {
  const cached = sessionStorage.getItem("traffic");
  if (cached) return JSON.parse(cached);
  const key = process.env.REACT_APP_TOMTOM_KEY;
  const bbox = "77.4,12.8,77.8,13.2";
  try {
    const res = await fetch(
      `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${key}&bbox=${bbox}&fields={incidents{type,geometry{type,coordinates},properties{iconCategory,magnitudeOfDelay,events{description,code},startTime,endTime,from,to,length,delay,roadNumbers,timeValidity}}}&language=en-GB&categoryFilter=0,1,2,3,4,5,6,7,8,9,10,11&timeValidityFilter=present`
    );
    const data = await res.json();
    const incidents = data.incidents || [];
    sessionStorage.setItem("traffic", JSON.stringify(incidents));
    return incidents;
  } catch { return []; }
};

const popupSelect = {
  width: "100%", padding: "6px 8px",
  borderRadius: "6px", background: "#1e293b",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#f1f5f9", fontSize: "12px",
  fontFamily: "Inter, sans-serif",
  cursor: "pointer", marginTop: "4px",
};

function HeatmapLayer({ potholes }) {
  const map = useMap();
  const heatRef = useRef(null);

  useEffect(() => {
    if (!potholes.length) return;
    const points = potholes.map(p => [
      parseFloat(p.latitude),
      parseFloat(p.longitude),
      severityHeatWeight[p.severity] || 0.5
    ]);
    if (heatRef.current) map.removeLayer(heatRef.current);
    heatRef.current = L.heatLayer(points, {
      radius: 40, blur: 30, maxZoom: 15,
      gradient: { 0.25: "#22c55e", 0.5: "#eab308", 0.75: "#f97316", 1.0: "#ef4444" }
    }).addTo(map);
    return () => { if (heatRef.current) map.removeLayer(heatRef.current); };
  }, [potholes, map]);

  return null;
}

export default function MapDashboard() {
  const [potholes, setPotholes] = useState([]);
  const [trafficIncidents, setTrafficIncidents] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [upvotes, setUpvotes] = useState({});
  const [upvoted, setUpvoted] = useState({});
  const [showHeatmap, setShowHeatmap] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [potholesRes, trafficData] = await Promise.all([getPotholes(), fetchTrafficIncidents()]);
      const real = potholesRes.status === "success" ? potholesRes.data : [];
      setPotholes(real);
      // Initialize upvotes from data
      const upvoteMap = {};
      real.forEach(p => { upvoteMap[p.incident_id] = parseInt(p.upvotes) || 0; });
      setUpvotes(upvoteMap);
      setTrafficIncidents(trafficData);
    };
    load().catch(() => setPotholes([]));
  }, []);

  const handleStatusUpdate = async (incidentId, newStatus) => {
    try {
      await updateStatus(incidentId, newStatus);
      setStatuses(prev => ({ ...prev, [incidentId]: newStatus }));
    } catch { alert("Failed to update status"); }
  };

  const handleUpvote = async (incidentId) => {
    if (upvoted[incidentId]) return;
    try {
      const res = await upvotePothole(incidentId);
      if (res.status === "success") {
        setUpvotes(prev => ({ ...prev, [incidentId]: res.data.upvotes }));
        setUpvoted(prev => ({ ...prev, [incidentId]: true }));
      }
    } catch { }
  };

  const legend = [
    { label: "Critical", color: "#ef4444" },
    { label: "High", color: "#f97316" },
    { label: "Medium", color: "#eab308" },
    { label: "Low", color: "#22c55e" },
    { label: "In Progress", color: "#3b82f6" },
    { label: "Under Review", color: "#f59e0b" },
    { label: "Fixed", color: "#22c55e" },
    { label: "Traffic", color: "#818cf8" },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          {legend.map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-secondary)" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: l.color, display: "inline-block", boxShadow: `0 0 6px ${l.color}` }} />
              {l.label}
            </div>
          ))}
        </div>
        <button
          onClick={() => setShowHeatmap(h => !h)}
          style={{
            padding: "8px 16px", fontSize: "12px", fontWeight: "600",
            background: showHeatmap ? "#ef4444" : "#6366f1",
            color: "white", border: "none", borderRadius: "8px",
            cursor: "pointer", transition: "all 0.2s"
          }}
        >
          {showHeatmap ? "🗺️ Show Markers" : "🔥 Show Heatmap"}
        </button>
      </div>

      <div style={{ height: "520px", width: "100%", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)" }}>
        <MapContainer center={[12.9352, 77.6245]} zoom={12} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          {showHeatmap && <HeatmapLayer potholes={potholes} />}

          {!showHeatmap && potholes.map((p) => (
            <CircleMarker
              key={`${p.incident_id}-${statuses[p.incident_id] || p.status}`}
              center={[parseFloat(p.latitude), parseFloat(p.longitude)]}
              radius={12}
              fillColor={statusColor[statuses[p.incident_id] || p.status] || severityColor[p.severity] || "#eab308"}
              color="rgba(0,0,0,0.4)"
              weight={1}
              fillOpacity={0.9}
            >
              <Popup minWidth={240}>
                <div style={{ fontFamily: "Inter, sans-serif" }}>
                  {/* Severity */}
                  <div style={{ fontWeight: "700", fontSize: "13px", color: severityColor[p.severity], marginBottom: "6px" }}>
                    {p.severity} Pothole
                  </div>

                  {/* Status */}
                  <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "2px" }}>
                    Status: <span style={{ color: "#f1f5f9", fontWeight: "600" }}>{statuses[p.incident_id] || p.status}</span>
                  </div>

                  {/* Description */}
                  {p.description && (
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>{p.description}</div>
                  )}

                  {/* Timestamp */}
                  <div style={{ fontSize: "10px", color: "#475569", marginBottom: "10px" }}>
                    {new Date(p.timestamp).toLocaleString()}
                  </div>

                  {/* Upvote button */}
                  <button
                    onClick={() => handleUpvote(p.incident_id)}
                    disabled={upvoted[p.incident_id]}
                    style={{
                      width: "100%", padding: "8px", marginBottom: "8px",
                      background: upvoted[p.incident_id] ? "#22c55e22" : "#6366f122",
                      color: upvoted[p.incident_id] ? "#22c55e" : "#818cf8",
                      border: `1px solid ${upvoted[p.incident_id] ? "#22c55e44" : "#6366f144"}`,
                      borderRadius: "6px", cursor: upvoted[p.incident_id] ? "default" : "pointer",
                      fontSize: "12px", fontWeight: "600"
                    }}
                  >
                    {upvoted[p.incident_id] ? "✅ Upvoted!" : `👍 ${upvotes[p.incident_id] || 0}`}
                  </button>

                  {/* Status update */}
                  <div style={{ fontSize: "10px", color: "#475569", marginBottom: "4px" }}>Update Status:</div>
                  <select
                    value={statuses[p.incident_id] || p.status}
                    onChange={(e) => handleStatusUpdate(p.incident_id, e.target.value)}
                    style={popupSelect}
                  >
                    <option value="reported">📌 Reported</option>
                    <option value="under_review">🔍 Under Review</option>
                    <option value="in_progress">🔧 In Progress</option>
                    <option value="fixed">✅ Fixed</option>
                  </select>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {trafficIncidents.slice(0, 20).map((incident, i) => {
            const coords = incident.geometry?.coordinates;
            if (!coords) return null;
            const lat = Array.isArray(coords[0]) ? coords[0][1] : coords[1];
            const lng = Array.isArray(coords[0]) ? coords[0][0] : coords[0];
            if (isNaN(lat) || isNaN(lng)) return null;
            return (
              <CircleMarker key={`traffic-${i}`} center={[lat, lng]} radius={8} fillColor="#818cf8" color="#4f46e5" weight={1} fillOpacity={0.8}>
                <Popup>
                  <div style={{ fontFamily: "Inter, sans-serif" }}>
                    <div style={{ fontWeight: "700", fontSize: "13px", color: "#818cf8", marginBottom: "6px" }}>🚦 Traffic Incident</div>
                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>{incident.properties?.events?.[0]?.description || "Traffic disruption"}</div>
                    {incident.properties?.from && <div style={{ fontSize: "11px", color: "#94a3b8" }}>From: {incident.properties.from}</div>}
                    {incident.properties?.to && <div style={{ fontSize: "11px", color: "#94a3b8" }}>To: {incident.properties.to}</div>}
                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>Delay: {incident.properties?.delay ? `${Math.round(incident.properties.delay / 60)} mins` : "Unknown"}</div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {trafficIncidents.length > 0 && (
        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "10px" }}>
          🟣 Showing {Math.min(trafficIncidents.length, 20)} live traffic incidents from TomTom
        </p>
      )}
    </div>
  );
}
