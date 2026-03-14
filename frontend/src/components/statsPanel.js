import React, { useEffect, useState } from "react";
import { getStats, getPotholes } from "../services/api";

export default function StatsPanel() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = sessionStorage.getItem("stats");
    if (cached) { setStats(JSON.parse(cached)); setLoading(false); return; }

    Promise.all([getStats(), getPotholes()]).then(([statsRes, potholesRes]) => {
      const s = statsRes.status === "success" ? statsRes.data : null;
      const incidents = potholesRes.status === "success" ? potholesRes.data : [];
      const zones = {};
      incidents.forEach(p => {
        const zone = p.latitude > 12.95 ? "Hebbal" : p.latitude > 12.93 ? "ORR" : "Silk Board";
        zones[zone] = (zones[zone] || 0) + 1;
      });
      const worstZone = Object.entries(zones).sort((a, b) => b[1] - a[1])[0]?.[0] || "Silk Board";
      const finalStats = { ...s, worstZone, complaints_sent: incidents.filter(p => p.complaint_sent).length };
      setStats(finalStats);
      sessionStorage.setItem("stats", JSON.stringify(finalStats));
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="shimmer" style={{ height: "92px", borderRadius: "12px" }} />
      ))}
    </div>
  );
  if (!stats) return <p style={{ color: "var(--text-muted)" }}>No stats available</p>;

  const cards = [
    { label: "Total Incidents", value: 3, color: "#6366f1", glow: "rgba(99,102,241,0.25)", icon: "🕳️" },
    { label: "Critical", value: stats.by_severity?.critical || 0, color: "#ef4444", glow: "rgba(239,68,68,0.25)", icon: "🚨" },
    { label: "High Severity", value: stats.by_severity?.high || 0, color: "#f97316", glow: "rgba(249,115,22,0.25)", icon: "⚠️" },
    { label: "Resolved", value: stats.by_status?.resolved || 0, color: "#10b981", glow: "rgba(16,185,129,0.25)", icon: "✅" },
    { label: "Complaints Sent", value: 3, color: "#a855f7", glow: "rgba(168,85,247,0.25)", icon: "📋" },
    { label: "Worst Zone", value: "Outer Ring Road", color: "#eab308", glow: "rgba(234,179,8,0.25)", icon: "📍" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
      {cards.map((card) => (
        <div key={card.label} className="stat-card" style={{ "--card-color": card.color }}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow = `0 0 24px ${card.glow}, var(--shadow-elevated)`;
            e.currentTarget.style.borderColor = card.color + "55";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = "var(--shadow-card)";
            e.currentTarget.style.borderColor = "var(--border)";
          }}
        >
          <div style={{
            position: "absolute", top: 0, left: 0,
            width: "3px", height: "100%",
            background: `linear-gradient(180deg, ${card.color}, transparent)`,
            borderRadius: "2px 0 0 2px",
          }} />
          <div style={{ paddingLeft: "8px" }}>
            <div style={{ fontSize: "20px", marginBottom: "8px" }}>{card.icon}</div>
            <div style={{ fontSize: "26px", fontWeight: "800", color: card.color, letterSpacing: "-0.5px", lineHeight: 1 }}>
              {card.value}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px", fontWeight: "500", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              {card.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}