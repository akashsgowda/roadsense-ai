from fastapi import APIRouter
from utils.response import success, error
from services.dynamo_service import get_all_incidents, update_incident_status, table
router = APIRouter()

@router.get("/potholes")
def get_potholes():
    try:
        incidents = get_all_incidents()
        return success(incidents, "Potholes fetched successfully")
    except Exception as e:
        return error(str(e))

@router.patch("/potholes/{incident_id}/status")
def update_status(incident_id: str, body: dict):
    try:
        result = update_incident_status(incident_id, body.get("status"))
        return success(result, "Status updated")
    except Exception as e:
        return error(str(e))

@router.post("/potholes/{incident_id}/upvote")
def upvote_pothole(incident_id: str):
    try:
        table.update_item(
            Key={"incident_id": incident_id},
            UpdateExpression="SET upvotes = if_not_exists(upvotes, :zero) + :one",
            ExpressionAttributeValues={":zero": 0, ":one": 1}
        )
        # Get updated upvote count
        incidents = get_all_incidents()
        incident = next((i for i in incidents if i["incident_id"] == incident_id), None)
        upvotes = int(incident.get("upvotes", 1)) if incident else 1
        return success({"upvotes": upvotes}, "Upvoted successfully")
    except Exception as e:
        return error(str(e))

@router.get("/potholes/{incident_id}")
def get_pothole(incident_id: str):
    try:
        incidents = get_all_incidents()
        incident = next((i for i in incidents if i["incident_id"] == incident_id), None)
        if not incident:
            return error("Incident not found")
        return success(incident, "Incident fetched")
    except Exception as e:
        return error(str(e))
