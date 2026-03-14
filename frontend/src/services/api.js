const BASE_URL = "http://127.0.0.1:8000/api";

export const uploadIncident = async (imageFile, latitude, longitude) => {
  const formData = new FormData();
  formData.append("image", imageFile);
  formData.append("latitude", latitude);
  formData.append("longitude", longitude);

  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });
  return res.json();
};

export const getStats = async () => {
  const res = await fetch(`${BASE_URL}/stats`);
  return res.json();
};

export const getPotholes = async () => {
  const res = await fetch(`${BASE_URL}/potholes`);
  return res.json();
};

export const getComplaint = async (incidentId) => {
  const res = await fetch(`${BASE_URL}/complaint/${incidentId}`);
  return res.json();
};
export const updateStatus = async (incidentId, status) => {
  const res = await fetch(`${BASE_URL}/potholes/${incidentId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
  return res.json();
};
