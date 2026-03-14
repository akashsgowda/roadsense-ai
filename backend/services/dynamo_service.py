import boto3
import uuid
from datetime import datetime
from botocore.exceptions import ClientError
from config import settings

dynamodb = boto3.resource(
    "dynamodb",
    aws_access_key_id=settings.AWS_ACCESS_KEY,
    aws_secret_access_key=settings.AWS_SECRET_KEY,
    region_name=settings.AWS_REGION
)

table = dynamodb.Table(settings.DYNAMODB_TABLE)

def save_incident(latitude: float, longitude: float, severity: str, image_url: str, ai_result: dict = {}) -> dict:
    incident_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()

    item = {
        "incident_id": incident_id,
        "timestamp": timestamp,
        "latitude": str(latitude),
        "longitude": str(longitude),
        "severity": severity,
        "image_url": image_url,
        "status": "reported",
        "confidence": str(ai_result.get("confidence", 70)),
        "size_estimate": ai_result.get("size_estimate", "unknown"),
        "risk_level": ai_result.get("risk_level", "unknown"),
        "description": ai_result.get("description", "Road damage detected"),
        "complaint_sent": False,
        "vehicle_damage_cost_per_day": str(ai_result.get("vehicle_damage_cost_per_day", 0)),
        "repair_cost": str(ai_result.get("repair_cost", 0)),
        "monthly_savings_if_fixed": str(ai_result.get("monthly_savings_if_fixed", 0)),
    }

    try:
        table.put_item(Item=item)
        return item
    except ClientError as e:
        raise Exception(f"DynamoDB save failed: {str(e)}")


def get_all_incidents() -> list:
    try:
        response = table.scan()
        return response.get("Items", [])
    except ClientError as e:
        raise Exception(f"DynamoDB fetch failed: {str(e)}")


def update_incident_status(incident_id: str, status: str) -> dict:
    try:
        table.update_item(
            Key={"incident_id": incident_id},
            UpdateExpression="SET #s = :s",
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={":s": status}
        )
        return {"incident_id": incident_id, "status": status}
    except ClientError as e:
        raise Exception(f"DynamoDB update failed: {str(e)}")