import React, { useEffect, useState } from "react";

const API_URL = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/predict/risk-zones` 
  : "http://localhost:8000/predict/risk-zones";

function riskColor(score) {
  if (score > 70) return "#ef4444";
  if (score >= 40) return "#f97316";
  return "#22c55e";
}

function RiskCard({ ward, score, reason, dominant_factor }) {
  const color = riskColor(score);
  const factorColors = {
    "Rainfall":        "#3b82f6",
    "Pothole Density": "#ef4444",
    "Traffic":         "#f97316",
    "Road Age":        "#eab308",
  };
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "10px",
      padding: "14px 16px",
      marginBottom: "10px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <span style={{ fontSize: "13px", fontWeight: "600", color: "#f1f5f9" }}>{ward}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {dominant_factor && (
            <span style={{
              fontSize: "10px", fontWeight: "600", padding: "2px 8px", borderRadius: "20px",
              background: `${factorColors[dominant_factor] || "#6b7280"}22`,
              color: factorColors[dominant_factor] || "#9ca3af",
              border: `1px solid ${factorColors[dominant_factor] || "#6b7280"}44`,
            }}>
              {dominant_factor}
            </span>
          )}
          <span style={{ fontSize: "13px", fontWeight: "700", color }}>{score}</span>
        </div>
      </div>

      {/* Risk bar */}
      <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "4px", height: "6px", marginBottom: "8px" }}>
        <div style={{
          width: `${Math.min(score, 100)}%`,
          height: "100%",
          borderRadius: "4px",
          background: color,
          transition: "width 0.6s ease",
          boxShadow: `0 0 8px ${color}88`,
        }} />
      </div>

      <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>{reason}</p>
    </div>
  );
}

export default function RiskPredictionPanel() {
  const [zones, setZones] = useState([]);
  const [dataSources, setDataSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetch(API_URL)
      .then(r => r.json())
      .then(data => {
        if (data.status === "success") {
          // Handle both old list shape and new { zones, data_sources } shape
          const payload = data.data;
          if (Array.isArray(payload)) {
            setZones(payload);
          } else {
            setZones(payload.zones || []);
            setDataSources(payload.data_sources || []);
          }
        } else {
          setErr("Failed to load risk zones");
        }
      })
      .catch(() => setErr("Could not reach prediction service"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#f1f5f9", margin: "0 0 4px" }}>
          🤖 AI Pothole Prediction — Next 30 Days
        </h3>
        <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 8px" }}>
          Top 5 high-risk wards based on rainfall, pothole density, traffic congestion &amp; road age
        </p>
        {dataSources.length > 0 && (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {dataSources.map(src => (
              <span key={src} style={{
                fontSize: "10px", padding: "2px 8px", borderRadius: "20px",
                background: "rgba(99,102,241,0.12)", color: "#818cf8",
                border: "1px solid rgba(99,102,241,0.25)"
              }}>
                {src}
              </span>
            ))}
          </div>
        )}
      </div>

      {loading && <p style={{ fontSize: "12px", color: "#64748b" }}>Loading predictions...</p>}
      {err && <p style={{ fontSize: "12px", color: "#ef4444" }}>{err}</p>}
      {!loading && !err && zones.map(z => (
        <RiskCard key={z.ward} ward={z.ward} score={z.score} reason={z.reason} dominant_factor={z.dominant_factor} />
      ))}
    </div>
  );
}
