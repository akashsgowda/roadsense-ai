const WARD_MAP = [
  // Your uploads area
  { ward: "Electronic City Phase 1", wardNo: 198, lat: 12.8458, lng: 77.6692 },
  { ward: "Electronic City Phase 2", wardNo: 197, lat: 12.8392, lng: 77.6801 },
  { ward: "Begur", wardNo: 176, lat: 12.8521, lng: 77.6249 },
  { ward: "Bommanahalli", wardNo: 175, lat: 12.8961, lng: 77.6259 },

  // Teammate's uploads area (12.903, 77.509)
  { ward: "Uttarahalli", wardNo: 193, lat: 12.9031, lng: 77.5091 },
  { ward: "Kengeri", wardNo: 192, lat: 12.9063, lng: 77.5488 },
  { ward: "Padmanabhanagar", wardNo: 154, lat: 12.9108, lng: 77.5449 },

  // Common Bengaluru areas
  { ward: "HSR Layout", wardNo: 174, lat: 12.9116, lng: 77.6389 },
  { ward: "Koramangala", wardNo: 151, lat: 12.9352, lng: 77.6245 },
  { ward: "Silk Board", wardNo: 177, lat: 12.9172, lng: 77.6101 },
  { ward: "Jayanagar", wardNo: 155, lat: 12.9299, lng: 77.5826 },
  { ward: "JP Nagar", wardNo: 153, lat: 12.9063, lng: 77.5857 },
  { ward: "Marathahalli", wardNo: 84, lat: 12.9698, lng: 77.7499 },
  { ward: "Whitefield", wardNo: 82, lat: 12.9782, lng: 77.7408 },
  { ward: "KR Puram", wardNo: 23, lat: 12.9592, lng: 77.6974 },
  { ward: "Hebbal", wardNo: 3, lat: 13.0358, lng: 77.5970 },
  { ward: "Indiranagar", wardNo: 74, lat: 12.9784, lng: 77.6408 },
  { ward: "Bannerghatta", wardNo: 184, lat: 12.8636, lng: 77.5988 },
];

export function getWard(lat, lng) {
  let closest = WARD_MAP[0];
  let minDist = Infinity;
  for (const w of WARD_MAP) {
    const dist = Math.sqrt(Math.pow(lat - w.lat, 2) + Math.pow(lng - w.lng, 2));
    if (dist < minDist) { minDist = dist; closest = w; }
  }
  return closest;
}
