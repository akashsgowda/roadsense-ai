import React, { useEffect, useState } from "react";
import { getPotholes } from "../services/api";
import { getWard } from "../services/wardService";

const severityScore = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, critical: 4, high: 3, medium: 2, low: 1 };
const repairCost = { CRITICAL: 50000, HIGH: 25000, MEDIUM: 10000, LOW: 5000, critical: 50000, high: 25000, medium: 10000, low: 5000 };
const trafficDensity = { CRITICAL: 3, HIGH: 2.5, MEDIUM: 2, LOW: 1 };

const sevClass = { CRITICAL: "badge-critical", HIGH: "badge-high", MEDIUM: "badge-medium", LOW: "badge-low", critical: "badge-critical", high: "badge-high", medium: "badge-medium", low: "badge-low" };

export default function PriorityList() {
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    getPotholes().then((res) => {
      const data = res.status === "success" ? res.data : [];

      const all = data.map((p) => {
        const sev = severityScore[p.severity] || 1;
        const count = parseInt(p.report_count) || 1;
        const traffic = trafficDensity[p.severity] || 1;
        const cost = repairCost[p.severity] || 10000;
        const priority = Math.round((sev * count * traffic * 1000) / cost);
        const ward = getWard(parseFloat(p.latitude), parseFloat(p.longitude));
        return { ...p, priority, ward: ward.ward, wardNo: ward.wardNo };
      });
      setIncidents(all.sort((a, b) => b.priority - a.priority));
    });
  }, []);

  return (
    <div>
      <div style={{ marginBottom: "18px" }}>
        <div className="section-title">🔧 Repair Priority</div>
        <div className="section-subtitle">Higher score = fix first</div>
      </div>
      {incidents.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "40px 20px",
          color: "var(--text-muted)", fontSize: "13px",
        }}>
          <div style={{ fontSize: "28px", marginBottom: "10px" }}>✅</div>
          No priority incidents at the moment
        </div>
      ) : (
        <table className="dark-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Ward</th>
              <th>Severity</th>
              <th>Score</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((p, i) => (
              <tr key={p.incident_id}>
                <td style={{ color: "var(--text-muted)", fontWeight: "600" }}>{i + 1}</td>
                <td>
                  <div style={{ color: "var(--text-primary)", fontWeight: "600", fontSize: "12px" }}>{p.ward}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>Ward {p.wardNo}</div>
                </td>
                <td>
                  <span className={`badge ${sevClass[p.severity] || "badge-medium"}`}>
                    {p.severity}
                  </span>
                </td>
                <td>
                  <span style={{ fontWeight: "700", fontSize: "14px", color: p.priority > 5 ? "#f87171" : "#fb923c" }}>
                    {p.priority}
                  </span>
                </td>
                <td style={{ fontSize: "11px", fontWeight: "600" }}>
                  {p.priority > 5
                    ? <span style={{ color: "#f87171" }}>🚨 Immediate</span>
                    : p.priority > 2
                    ? <span style={{ color: "#fb923c" }}>⚠️ This Week</span>
                    : <span style={{ color: "var(--text-muted)" }}>📅 Scheduled</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
