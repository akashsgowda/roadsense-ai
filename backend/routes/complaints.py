from fastapi import APIRouter
import urllib.request
import json
from utils.response import success, error
from services.dynamo_service import get_all_incidents
from services.bedrock_service import generate_complaint

router = APIRouter()

def reverse_geocode(latitude, longitude):
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?lat={latitude}&lon={longitude}&format=json"
        req = urllib.request.Request(url, headers={"User-Agent": "RoadSenseAI/1.0"})
        with urllib.request.urlopen(req, timeout=5) as res:
            data = json.loads(res.read().decode("utf-8"))
            addr = data.get("address", {})
            parts = [
                addr.get("road") or addr.get("pedestrian") or addr.get("path"),
                addr.get("suburb") or addr.get("neighbourhood"),
                addr.get("city") or addr.get("town") or "Bengaluru"
            ]
            return ", ".join([p for p in parts if p])
    except Exception:
        return f"Near ({latitude}, {longitude}), Bengaluru"

@router.get("/complaint/{incident_id}")
def get_complaint(incident_id: str):
    try:
        incidents = get_all_incidents()
        incident = next((i for i in incidents if i["incident_id"] == incident_id), None)

        if not incident:
            return error("Incident not found")

        # Reverse geocode to get street name
        street_name = reverse_geocode(incident["latitude"], incident["longitude"])

        complaint = generate_complaint(
            incident_id=incident["incident_id"],
            latitude=incident["latitude"],
            longitude=incident["longitude"],
            street_name=street_name,
            severity=incident["severity"],
            image_url=incident.get("image_url", ""),
            timestamp=incident.get("timestamp", ""),
            confidence=incident.get("confidence", "N/A"),
            size_estimate=incident.get("size_estimate", "N/A"),
            risk_level=incident.get("risk_level", "N/A"),
            description=incident.get("description", "N/A"),
            vehicle_damage_cost=int(float(incident.get("vehicle_damage_cost_per_day", 0))),
            repair_cost=int(float(incident.get("repair_cost", 0))),
            monthly_savings=int(float(incident.get("monthly_savings_if_fixed", 0))),
        )

        return success({"complaint": complaint}, "Complaint generated")

    except Exception as e:
        return error(str(e))