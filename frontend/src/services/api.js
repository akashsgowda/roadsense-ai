const BASE_URL = "https://roadsense-ai.onrender.com/api";

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

export const upvotePothole = async (incidentId) => {
  const res = await fetch(`${BASE_URL}/potholes/${incidentId}/upvote`, {
    method: "POST"
  });
  return res.json();
};

export const sendBatchComplaints = async () => {
  const res = await fetch(`${BASE_URL}/complaints/send-batch`, { method: "POST" });
  return res.json();
};
