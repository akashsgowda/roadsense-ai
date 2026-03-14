import React, { useEffect, useState } from "react";

const STAGES = [
  { key: "reported", label: "Reported", icon: "📌", desc: "Your report has been submitted" },
  { key: "under_review", label: "Under Review", icon: "🔍", desc: "BBMP is reviewing the complaint" },
  { key: "in_progress", label: "In Progress", icon: "🔧", desc: "Repair work has been scheduled" },
  { key: "fixed", label: "Fixed", icon: "✅", desc: "Pothole has been repaired!" },
];

const stageIndex = { reported: 0, under_review: 1, in_progress: 2, fixed: 3 };

export default function StatusTracker({ incidentId, severity, onClose }) {
  const [incident, setIncident] = useState(null);
  const [upvotes, setUpvotes] = useState(0);
  const [upvoted, setUpvoted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!incidentId) return;
    fetch(`http://127.0.0.1:8000/api/potholes/${incidentId}`)
      .then(r => r.json())
      .then(res => {
        if (res.status === "success") {
          setIncident(res.data);
          setUpvotes(parseInt(res.data.upvotes) || 0);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [incidentId]);

  const handleUpvote = async () => {
    if (upvoted) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/potholes/${incidentId}/upvote`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.status === "success") {
        setUpvotes(data.data.upvotes);
        setUpvoted(true);
      }
    } catch { }
  };

  const currentStage = incident ? (stageIndex[incident.status] ?? 0) : 0;

  const sevColor = {
    CRITICAL: "#ef4444", HIGH: "#f97316", MEDIUM: "#eab308", LOW: "#22c55e"
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.7)", zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{
        background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "16px", padding: "28px", maxWidth: "520px", width: "100%",
        boxShadow: "0 25px 50px rgba(0,0,0,0.5)"
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
          <div>
            <h2 style={{ color: "white", fontSize: "18px", fontWeight: "700", margin: 0 }}>
              🕳️ Pothole Report Tracker
            </h2>
            <p style={{ color: "#64748b", fontSize: "11px", margin: "4px 0 0 0" }}>
              ID: {incidentId?.slice(0, 8)}...
            </p>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.1)", border: "none", color: "white",
            borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "13px"
          }}>✕</button>
        </div>

        {loading ? (
          <p style={{ color: "#64748b", textAlign: "center" }}>Loading...</p>
        ) : (
          <>
            {/* Severity badge */}
            {incident && (
              <div style={{ marginBottom: "24px", display: "flex", gap: "10px", alignItems: "center" }}>
                <span style={{
                  background: sevColor[incident.severity] + "22",
                  color: sevColor[incident.severity],
                  border: `1px solid ${sevColor[incident.severity]}44`,
                  padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700"
                }}>
                  {incident.severity}
                </span>
                <span style={{ color: "#64748b", fontSize: "12px" }}>
                  {incident.description?.slice(0, 60)}...
                </span>
              </div>
            )}

            {/* Progress tracker */}
            <div style={{ marginBottom: "28px" }}>
              {STAGES.map((stage, i) => {
                const isCompleted = i < currentStage;
                const isCurrent = i === currentStage;
                const isPending = i > currentStage;

                return (
                  <div key={stage.key} style={{ display: "flex", gap: "16px", marginBottom: i < STAGES.length - 1 ? "0" : "0" }}>
                    {/* Icon + line */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{
                        width: "36px", height: "36px", borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "16px", flexShrink: 0,
                        background: isCompleted ? "#22c55e22" : isCurrent ? "#6366f122" : "rgba(255,255,255,0.05)",
                        border: `2px solid ${isCompleted ? "#22c55e" : isCurrent ? "#6366f1" : "rgba(255,255,255,0.1)"}`,
                        boxShadow: isCurrent ? "0 0 12px rgba(99,102,241,0.4)" : "none"
                      }}>
                        {stage.icon}
                      </div>
                      {i < STAGES.length - 1 && (
                        <div style={{
                          width: "2px", height: "32px", margin: "4px 0",
                          background: isCompleted ? "#22c55e" : "rgba(255,255,255,0.1)"
                        }} />
                      )}
                    </div>

                    {/* Text */}
                    <div style={{ paddingTop: "6px", paddingBottom: i < STAGES.length - 1 ? "0" : "0" }}>
                      <div style={{
                        fontSize: "13px", fontWeight: "700",
                        color: isCompleted ? "#22c55e" : isCurrent ? "white" : "#475569"
                      }}>
                        {stage.label}
                        {isCurrent && (
                          <span style={{
                            marginLeft: "8px", fontSize: "10px",
                            background: "#6366f133", color: "#818cf8",
                            padding: "2px 8px", borderRadius: "10px"
                          }}>Current</span>
                        )}
                      </div>
                      <div style={{ fontSize: "11px", color: isPending ? "#334155" : "#64748b", marginTop: "2px" }}>
                        {stage.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Upvote section */}
            <div style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px", padding: "16px",
              display: "flex", alignItems: "center", justifyContent: "space-between"
            }}>
              <div>
                <div style={{ color: "white", fontSize: "13px", fontWeight: "600" }}>
                  👥 Community Support
                </div>
                <div style={{ color: "#64748b", fontSize: "11px", marginTop: "2px" }}>
                  {upvotes} {upvotes === 1 ? "person has" : "people have"} upvoted this issue
                </div>
              </div>
              <button
                onClick={handleUpvote}
                disabled={upvoted}
                style={{
                  padding: "10px 20px", borderRadius: "10px", border: "none",
                  background: upvoted ? "#22c55e22" : "#6366f1",
                  color: upvoted ? "#22c55e" : "white",
                  fontWeight: "700", fontSize: "13px", cursor: upvoted ? "default" : "pointer",
                  transition: "all 0.2s",
                  border: upvoted ? "1px solid #22c55e44" : "none"
                }}
              >
                {upvoted ? "✅ Upvoted!" : "👍 Upvote"}
              </button>
            </div>

            {/* Info */}
            <p style={{ color: "#334155", fontSize: "11px", textAlign: "center", marginTop: "16px" }}>
              More upvotes = higher priority for BBMP repair
            </p>
          </>
        )}
      </div>
    </div>
  );
}
