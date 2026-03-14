import React, { useState } from "react";
import { uploadIncident, getComplaint } from "../services/api";

const sev2color = { CRITICAL: "#ef4444", HIGH: "#f97316", MEDIUM: "#eab308", LOW: "#22c55e" };

export default function UploadForm({ onUploadSuccess }) {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [locationName, setLocationName] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [complaint, setComplaint] = useState(null);
  const [complaintLoading, setComplaintLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  const handleLocationInput = async (value) => {
    setLocationSearch(value);
    setLocationName("");
    if (value.length < 3) { setSuggestions([]); return; }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5&countrycodes=in&viewbox=77.4,12.8,77.8,13.2&bounded=1`
      );
      setSuggestions(await res.json());
    } catch { setSuggestions([]); }
  };

  const handleSelectSuggestion = (place) => {
    setLatitude(place.lat);
    setLongitude(place.lon);
    setLocationName(place.display_name.split(",").slice(0, 3).join(","));
    setLocationSearch(place.display_name.split(",").slice(0, 2).join(","));
    setSuggestions([]);
  };

  const handleAutoDetect = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocationSearch("📡 Acquiring high-precision GPS signal...");
    const getPreciseLocation = (attempt = 1) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const accuracy = Math.round(pos.coords.accuracy);
          if (accuracy > 50 && attempt < 4) {
            setLocationSearch(`📡 Calibrating GPS (Attempt ${attempt}/3)...`);
            setTimeout(() => getPreciseLocation(attempt + 1), 2000);
            return;
          }
          setLatitude(lat);
          setLongitude(lng);
          setLocationSearch("📍 Detected location");
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
            const data = await res.json();
            const addr = data.address || {};
            const label = [
              addr.road || addr.pedestrian || addr.path,
              addr.suburb || addr.neighbourhood || addr.quarter,
              addr.city || addr.town || addr.village,
            ].filter(Boolean).join(", ");
            const finalName = label || (data.display_name ? data.display_name.split(",").slice(0,3).join(",") : "Unknown Location");
            setLocationName(`${finalName} (±${accuracy}m)`);
            setLocationSearch(label || (data.display_name ? data.display_name.split(",").slice(0,2).join(",") : ""));
          } catch {
            setLocationName(`Current Location (±${accuracy}m)`);
            setLocationSearch(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          }
          setSuggestions([]);
        },
        (err) => {
          setLocationSearch("");
          const msg = err.code === 1
            ? "Location access denied. Please allow location permission in your browser settings."
            : err.code === 2
            ? "Location unavailable. Try moving to an open area for better GPS."
            : "Location request timed out. Please try again outside.";
          alert(msg);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
      );
    };
    getPreciseLocation();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image || !latitude || !longitude) {
      setError("Please select an image and set a location.");
      return;
    }
    setLoading(true); setError(""); setResult(null); setComplaint(null);
    try {
      const res = await uploadIncident(image, latitude, longitude);
      if (res.status === "error") { setError(res.message || "Could not analyze image."); setLoading(false); return; }
      if (res.status === "success") { setResult(res.data); if (onUploadSuccess) onUploadSuccess(); }
    } catch { setError("Upload failed. Please check your connection and try again."); }
    setLoading(false);
  };

  const handleGenerateComplaint = async () => {
    if (!result?.incident_id) return;
    setComplaintLoading(true);
    try {
      const res = await getComplaint(result.incident_id);
      if (res.status === "success") setComplaint(res.data.complaint);
      else setComplaint("Failed to generate complaint. Please try again.");
    } catch { setComplaint("Error generating complaint."); }
    setComplaintLoading(false);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>

        {/* Image upload area */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
            Upload Image
          </label>
          <label style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            border: "2px dashed var(--border)", borderRadius: "12px",
            padding: preview ? "0" : "32px 20px",
            cursor: "pointer", transition: "var(--transition)",
            background: "var(--bg-surface)",
            overflow: "hidden", minHeight: "140px",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent-blue)"; e.currentTarget.style.background = "rgba(99,102,241,0.05)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg-surface)"; }}
          >
            {preview ? (
              <img src={preview} alt="preview" style={{ width: "100%", height: "180px", objectFit: "cover" }} />
            ) : (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "32px", marginBottom: "10px" }}>📸</div>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: "500" }}>Click to upload or drag & drop</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>JPG, PNG up to 10MB</div>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
          </label>
        </div>

        {/* Location input */}
        <div style={{ marginBottom: "20px", position: "relative" }}>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
            Location
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              placeholder="Search a location in Bengaluru..."
              value={locationSearch}
              onChange={(e) => handleLocationInput(e.target.value)}
              className="dark-input"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={handleAutoDetect}
              className="btn-secondary"
              style={{ whiteSpace: "nowrap", padding: "10px 14px", fontSize: "12px" }}
            >
              📍 My Location
            </button>
          </div>

          {suggestions.length > 0 && (
            <div style={{
              position: "absolute", zIndex: 1000,
              background: "var(--bg-card)", border: "1px solid var(--border-accent)",
              borderRadius: "10px", width: "100%", top: "100%", marginTop: "4px",
              boxShadow: "var(--shadow-elevated)", maxHeight: "200px", overflowY: "auto"
            }}>
              {suggestions.map((place, i) => (
                <div key={i}
                  onClick={() => handleSelectSuggestion(place)}
                  style={{ padding: "10px 14px", cursor: "pointer", fontSize: "12px", color: "var(--text-secondary)", borderBottom: "1px solid var(--border)", transition: "var(--transition)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-glass-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                >
                  📍 {place.display_name.split(",").slice(0, 3).join(",")}
                </div>
              ))}
            </div>
          )}

          {latitude && longitude && (
            <div style={{ fontSize: "12px", color: "var(--accent-green)", marginTop: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>✅</span> Location set: <strong>{locationName}</strong>
            </div>
          )}
        </div>

        {/* Submit button */}
        <button type="submit" disabled={loading} className="btn-danger" style={{ width: "100%", padding: "12px", fontSize: "14px" }}>
          {loading ? "⏳ Analyzing with AI..." : "🚨 Submit Report"}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div style={{
          marginTop: "16px", padding: "14px", fontSize: "13px",
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
          borderRadius: "10px", color: "#f87171"
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div style={{
          marginTop: "16px", padding: "20px",
          background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.25)",
          borderRadius: "12px"
        }}>
          <p style={{ fontWeight: "700", color: "#34d399", marginBottom: "14px", fontSize: "14px" }}>✅ Pothole Reported Successfully!</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
            {[
              { label: "Severity", value: result.severity, color: sev2color[result.severity] || "#eab308" },
              { label: "Confidence", value: `${result.confidence}%`, color: "#6366f1" },
              { label: "Size", value: result.size_estimate, color: "var(--text-primary)" },
              { label: "Risk", value: result.risk_level, color: "#f97316" },
            ].map(item => (
              <div key={item.label} style={{ background: "var(--bg-surface)", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>{item.label}</div>
                <div style={{ fontWeight: "700", color: item.color, fontSize: "13px" }}>{item.value}</div>
              </div>
            ))}
          </div>

          {result.description && (
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "14px", fontStyle: "italic", lineHeight: "1.6" }}>
              "{result.description}"
            </p>
          )}

          <div style={{ borderTop: "1px solid rgba(16,185,129,0.15)", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>💸 Vehicle damage/day: <strong style={{ color: "var(--text-primary)" }}>₹{Number(result.vehicle_damage_cost_per_day || 0).toLocaleString()}</strong></p>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>🔧 Repair cost: <strong style={{ color: "var(--text-primary)" }}>₹{Number(result.repair_cost || 0).toLocaleString()}</strong></p>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>💰 Monthly savings if fixed: <strong style={{ color: "#34d399" }}>₹{Number(result.monthly_savings_if_fixed || 0).toLocaleString()}</strong></p>
          </div>

          {/* COMPLAINT SECTION */}
          {!complaint ? (
            <button
              onClick={handleGenerateComplaint}
              disabled={complaintLoading}
              style={{
                width: "100%", padding: "12px",
                background: complaintLoading ? "#374151" : "linear-gradient(135deg, #7c3aed, #6366f1)",
                color: "white", border: "none", borderRadius: "10px",
                cursor: complaintLoading ? "not-allowed" : "pointer",
                fontSize: "13px", fontWeight: "600", fontFamily: "Inter, sans-serif"
              }}
            >
              {complaintLoading ? "⏳ Generating BBMP Complaint..." : "📋 Generate BBMP RTI Complaint"}
            </button>
          ) : (
            <div style={{
              background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)",
              borderRadius: "10px", padding: "16px"
            }}>
              <div style={{ fontSize: "12px", fontWeight: "600", color: "#818cf8", marginBottom: "10px" }}>
                📋 BBMP RTI Complaint Generated
              </div>
              <div style={{
                fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.8",
                maxHeight: "200px", overflowY: "auto", whiteSpace: "pre-wrap"
              }}>
                {complaint}
              </div>
              <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
                <button
                  onClick={() => navigator.clipboard.writeText(complaint)}
                  style={{
                    flex: 1, padding: "8px", background: "rgba(99,102,241,0.15)",
                    color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)",
                    borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600"
                  }}
                >
                  📋 Copy Complaint
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([complaint], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url; a.download = `bbmp_complaint_${result.incident_id}.txt`;
                    a.click();
                  }}
                  style={{
                    flex: 1, padding: "8px", background: "rgba(16,185,129,0.15)",
                    color: "#34d399", border: "1px solid rgba(16,185,129,0.3)",
                    borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600"
                  }}
                >
                  ⬇️ Download
                </button>
              </div>
              <p style={{ fontSize: "11px", color: "#34d399", marginTop: "8px" }}>✅ Complaint ready to submit to BBMP</p>
            </div>
          )}

          <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "10px" }}>ID: {result.incident_id}</p>
        </div>
      )}
    </div>
  );
}