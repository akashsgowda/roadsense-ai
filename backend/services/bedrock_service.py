import json
import os
import base64
import urllib.request
import ssl
from datetime import datetime

ssl._create_default_https_context = ssl._create_unverified_context

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


def call_openrouter(messages, model="openrouter/auto"):
    payload = json.dumps({
        "model": model,
        "messages": messages
    }).encode("utf-8")

    req = urllib.request.Request(
        OPENROUTER_URL,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "HTTP-Referer": "http://localhost:8000",
            "X-Title": "RoadSense"
        }
    )

    with urllib.request.urlopen(req, timeout=15) as response:
        return json.loads(response.read().decode("utf-8"))


def analyze_image_with_bedrock(image_bytes):
    image_base64 = base64.b64encode(image_bytes).decode("utf-8")

    prompt = """You are a road infrastructure analysis AI. Analyze this image carefully.

FIRST: Determine if this image contains a road, street, highway, or paved surface.
- If NO road is visible, respond with ONLY: {"error": "no_road"}
- If the image is blurry, dark, or unclear to analyze, respond with ONLY: {"error": "unclear_image"}

If a road IS visible, analyze for potholes or road damage and respond with ONLY valid JSON:
{
  "severity": "LOW|MEDIUM|HIGH|CRITICAL",
  "confidence": <integer 0-100>,
  "size_estimate": "small|medium|large|very_large",
  "risk_level": "low|moderate|high|extreme",
  "description": "<one sentence describing what you see>",
  "vehicle_damage_cost_per_day": <integer in INR>,
  "repair_cost": <integer in INR>,
  "monthly_savings_if_fixed": <integer in INR>,
  "has_road_damage": true|false
}

Severity guidelines:
- LOW: Minor cracks, surface wear. Confidence must be >70%
- MEDIUM: Visible pothole <30cm. Confidence must be >70%
- HIGH: Large pothole >30cm or multiple potholes. Confidence must be >75%
- CRITICAL: Dangerous pothole >50cm or structural damage. Confidence must be >80%

Cost guidelines (INR):
- LOW: damage=1000-2000/day, repair=5000-10000, savings=3000-6000/month
- MEDIUM: damage=3000-5000/day, repair=10000-20000, savings=9000-15000/month
- HIGH: damage=6000-10000/day, repair=20000-40000, savings=18000-30000/month
- CRITICAL: damage=10000-20000/day, repair=40000-80000, savings=30000-60000/month

IMPORTANT:
- If you are less than 60% confident it is a road, return {"error": "no_road"}
- Never guess or hallucinate — only report what you clearly see
- Return ONLY the JSON object, no other text"""

    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{image_base64}"
                    }
                },
                {
                    "type": "text",
                    "text": prompt
                }
            ]
        }
    ]

    try:
        response = call_openrouter(messages)
        response_text = response["choices"][0]["message"]["content"].strip()

        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        response_text = response_text.strip()

        try:
            result = json.loads(response_text)

            if "error" in result:
                return result

            if result.get("confidence", 0) < 60:
                return {"error": "low_confidence"}

            if not result.get("has_road_damage") and result.get("severity") == "LOW":
                return {"error": "no_damage_detected"}

            return result

        except json.JSONDecodeError:
            return {"error": "no_road"}

    except Exception as e:
        print(f"Bedrock error: {e}")
        return {"error": "bedrock_failed"}


def generate_complaint(
    incident_id, latitude, longitude, severity, image_url, street_name="Bengaluru Road",
    timestamp="", confidence="N/A", size_estimate="N/A",
    risk_level="N/A", description="N/A",
    vehicle_damage_cost=0, repair_cost=0, monthly_savings=0
):
    try:
        date_str = datetime.fromisoformat(timestamp).strftime("%d %B %Y")
    except Exception:
        date_str = datetime.now().strftime("%d %B %Y")

    prompt = f"""Generate a formal RTI Act 2005 complaint letter to BBMP about a pothole.
Do NOT use any placeholders like [Your Name] or [Your Address].
Write it as if submitted by a concerned citizen via the RoadSense AI platform.

Use EXACTLY this data — do not make up any values:

INCIDENT DETAILS:
- Incident ID: {incident_id}
- Date Reported: {date_str}
- Location: {street_name}
- GPS Coordinates: Latitude {latitude}, Longitude {longitude}
- Severity: {severity}
- AI Confidence: {confidence}%
- Pothole Size: {size_estimate}
- Risk Level: {risk_level}
- AI Description: {description}

ECONOMIC IMPACT:
- Vehicle Damage Cost: ₹{vehicle_damage_cost:,} per day
- Estimated Repair Cost: ₹{repair_cost:,}
- Monthly Savings if Fixed: ₹{monthly_savings:,}
- Annual Loss if Ignored: ₹{vehicle_damage_cost * 365:,}

EVIDENCE: {image_url}

The letter must:
1. Be addressed to: The Public Information Officer, BBMP, Bengaluru
2. Open with: "Sub: RTI Request and Complaint Regarding Dangerous Pothole at {street_name}, Bengaluru"
3. Cite RTI Act 2005 Section 6 and Motor Vehicles Act 1988
4. State all the above incident details and economic impact clearly
5. Demand: repair timeline, responsible officer name, action taken report
6. Give BBMP a 30-day deadline to respond
7. Mention that photographic evidence with AI analysis is attached (Incident ID: {incident_id})
8. Close with: "Submitted via RoadSense AI Platform — Bengaluru Pothole Intelligence System"

Be formal, firm, data-driven. Under 400 words. No placeholders whatsoever."""

    messages = [{"role": "user", "content": prompt}]

    try:
        response = call_openrouter(messages)
        return response["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"Complaint generation error: {e}")
        return f"Complaint generation failed: {str(e)}"