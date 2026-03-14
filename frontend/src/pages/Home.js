import React, { useState } from "react";
import UploadForm from "../components/UploadForm";
import StatsPanel from "../components/statsPanel";
import MapDashboard from "../components/MapDashboard";
import Leaderboard from "../components/Leaderboard";
import PriorityList from "../components/PriorityList";
import ROICalculator from "../components/ROICalculator";
import DemoMode from "../components/DemoMode";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: "⬡" },
  { id: "report", label: "Report", icon: "⊕" },
  { id: "map", label: "Live Map", icon: "◎" },
  { id: "analytics", label: "Analytics", icon: "⬡" },
  { id: "demo", label: "Demo", icon: "▶" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [refresh, setRefresh] = useState(0);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg-base)", overflow: "hidden" }}>

      {/* NAVBAR */}
      <nav style={{
        background: "rgba(13,19,32,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
        padding: "0 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "64px",
        flexShrink: 0,
        zIndex: 100,
        position: "sticky",
        top: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img src="/logo.png" alt="RoadSense.ai Logo" style={{ height: "40px", objectFit: "contain" }} />
          <div style={{
            display: "flex", alignItems: "center", gap: "5px",
            background: "rgba(16,185,129,0.1)",
            border: "1px solid rgba(16,185,129,0.3)",
            borderRadius: "20px", padding: "3px 10px",
            marginLeft: "4px",
          }}>
            <span className="pulse-dot" style={{ background: "var(--accent-green)" }}></span>
            <span style={{ fontSize: "10px", fontWeight: "700", color: "var(--accent-green)", letterSpacing: "0.08em" }}>LIVE</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: "flex", gap: "2px", background: "rgba(255,255,255,0.04)", padding: "4px", borderRadius: "12px", border: "1px solid var(--border)" }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id
                  ? "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(34,211,238,0.1))"
                  : "transparent",
                color: activeTab === tab.id ? "var(--text-primary)" : "var(--text-muted)",
                border: activeTab === tab.id ? "1px solid var(--border-accent)" : "1px solid transparent",
                padding: "7px 18px",
                borderRadius: "9px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "600",
                transition: "var(--transition)",
                fontFamily: "Inter, sans-serif",
                letterSpacing: "0.02em",
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right info */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--text-muted)" }}>
          <span style={{ fontSize: "16px" }}>📍</span>
          <span>Bengaluru, KA</span>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, overflow: "auto", padding: "28px 32px" }}>

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <div>
            <div style={{ marginBottom: "28px" }}>
              <h1 className="section-title" style={{ fontSize: "20px" }}>Overview</h1>
              <p className="section-subtitle">Real-time pothole intelligence for Bengaluru</p>
            </div>
            <div style={{ marginBottom: "28px" }}>
              <StatsPanel key={refresh} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div className="glass-card" style={{ padding: "24px" }}>
                <Leaderboard />
              </div>
              <div className="glass-card" style={{ padding: "24px" }}>
                <PriorityList />
              </div>
            </div>
          </div>
        )}

        {/* REPORT */}
        {activeTab === "report" && (
          <div style={{ maxWidth: "640px", margin: "0 auto" }}>
            <div style={{ marginBottom: "24px" }}>
              <h1 className="section-title" style={{ fontSize: "20px" }}>Report a Pothole</h1>
              <p className="section-subtitle">Upload a photo and tag your location for AI analysis</p>
            </div>
            <div className="glass-card" style={{ padding: "32px" }}>
             <UploadForm onUploadSuccess={() => { setRefresh(r => r + 1); }} />
            </div>
          </div>
        )}

        {/* MAP */}
        {activeTab === "map" && (
          <div>
            <div style={{ marginBottom: "20px" }}>
              <h1 className="section-title" style={{ fontSize: "20px" }}>Live Incident Map</h1>
              <p className="section-subtitle">Pothole clusters and real-time traffic incidents across Bengaluru</p>
            </div>
            <div className="glass-card" style={{ padding: "20px" }}>
              <MapDashboard key={`map-${refresh}`} />
            </div>
          </div>
        )}

        {/* ANALYTICS */}
        {activeTab === "analytics" && (
          <div>
            <div style={{ marginBottom: "24px" }}>
              <h1 className="section-title" style={{ fontSize: "20px" }}>Analytics & Priority</h1>
              <p className="section-subtitle">Severity rankings, risk zones, and repair ROI breakdown</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div className="glass-card" style={{ padding: "24px" }}>
                <Leaderboard />
              </div>
              <div className="glass-card" style={{ padding: "24px" }}>
                <PriorityList />
              </div>
            </div>
            <div className="glass-card" style={{ padding: "24px" }}>
              <ROICalculator />
            </div>
          </div>
        )}

        {/* DEMO */}
        {activeTab === "demo" && (
          <div>
            <div style={{ marginBottom: "20px" }}>
              <h1 className="section-title" style={{ fontSize: "20px" }}>Live Demo Mode</h1>
              <p className="section-subtitle">Auto-plays the full RoadSense AI pipeline for presentations</p>
            </div>
            <div className="glass-card" style={{ padding: "28px" }}>
              <DemoMode />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}