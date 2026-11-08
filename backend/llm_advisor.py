
import os
import json
import asyncio
import httpx
from pathlib import Path
from dotenv import load_dotenv

# --------------------------------------------------
# CONFIGURATION
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

API_KEY = os.getenv("OPENROUTER_API_KEY")

# Always use OpenRouter's free-model router by default.
MODEL = os.getenv("OPENROUTER_MODEL", "openrouter/free")

BASE_URL = "https://openrouter.ai/api/v1"

MAX_ATTEMPTS = 3

SUPPORTED_LANGUAGES = {
    "english": "English",
    "hindi": "Hindi",
    "hinglish": "Hinglish",
    "marathi": "Marathi",
    "kannada": "Kannada",
    "gujarati": "Gujarati",
    "telugu": "Telugu",
    "tamil": "Tamil",
    "bengali": "Bengali",
    "punjabi": "Punjabi",
    "malayalam": "Malayalam",
}


# --------------------------------------------------
# LANGUAGE HELPERS
# --------------------------------------------------

def normalize_language(language):

    if not isinstance(language, str):
        return "English"

    return SUPPORTED_LANGUAGES.get(
        language.strip().lower(),
        "English"
    )


def get_language_instruction(language):

    language = normalize_language(language)

    return f"""
LANGUAGE REQUIREMENT:
Respond in {language}.

If the user used Hinglish, respond in natural Hinglish
using Roman script.

If the user used Hindi, respond in natural Hindi.

If the user used English, respond in English.

For other supported Indian languages, respond in that
language using its normal script.

Keep official product names, technical terms and
catalogue labels unchanged.

Never change product prices, setup fees or contract
durations while translating.
"""


# --------------------------------------------------
# OPENROUTER API CALL WITH FREE-MODEL RETRIES
# --------------------------------------------------

async def call_llm(messages, temperature=0.2, max_tokens=2048):

    if not API_KEY:
        raise ValueError("OPENROUTER_API_KEY is missing")

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "Udyam360"
    }

    payload = {
        "model": MODEL,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens
    }

    async with httpx.AsyncClient(timeout=90) as client:

        for attempt in range(MAX_ATTEMPTS):

            try:
                response = await client.post(
                    f"{BASE_URL}/chat/completions",
                    headers=headers,
                    json=payload
                )

                response.raise_for_status()
                data = response.json()

                if data.get("error"):
                    raise ValueError(
                        f"OpenRouter error: {data['error']}"
                    )

                choices = data.get("choices", [])

                if not choices:
                    print("[OpenRouter response]", data)
                    raise ValueError(
                        "OpenRouter returned no choices"
                    )

                choice = choices[0]
                message = choice.get("message", {})
                content = message.get("content")

                if isinstance(content, list):
                    content = "".join(
                        item.get("text", "")
                        for item in content
                        if isinstance(item, dict)
                    )

                if not isinstance(content, str) or not content.strip():

                    print("[OpenRouter diagnostic]", {
                        "model": data.get("model"),
                        "finish_reason": choice.get("finish_reason"),
                        "usage": data.get("usage"),
                        "message": message
                    })

                    raise ValueError(
                        "OpenRouter returned empty message content"
                    )

                print(
                    f"[OpenRouter] Successful model: "
                    f"{data.get('model', MODEL)}"
                )

                return content.strip()

            except httpx.HTTPStatusError as exc:

                status_code = exc.response.status_code

                print(
                    "[OpenRouter HTTP error]",
                    status_code,
                    exc.response.text
                )

                # Retry only temporary provider/server errors.
                if status_code not in (429, 503):
                    raise

                if attempt == MAX_ATTEMPTS - 1:
                    raise

                retry_after = exc.response.headers.get(
                    "Retry-After"
                )

                try:
                    wait_seconds = float(retry_after)
                except (TypeError, ValueError):
                    wait_seconds = 2 ** attempt

                wait_seconds = max(1, min(wait_seconds, 15))

                print(
                    f"[OpenRouter] Attempt {attempt + 1} failed. "
                    f"Retrying in {wait_seconds} seconds..."
                )

                await asyncio.sleep(wait_seconds)

            except httpx.TimeoutException:
                raise RuntimeError(
                    "OpenRouter request timed out"
                )

            except httpx.RequestError as exc:
                raise RuntimeError(
                    f"OpenRouter connection failed: {exc}"
                )


# --------------------------------------------------
# BUSINESS REQUIREMENT EXTRACTION
# --------------------------------------------------

async def extract_business_requirements(message, profile=None):

    profile = profile or {}

    system_prompt = """
You are the requirement extraction engine for Udyam360,
an MSME telecom and digital services advisor in India.

Understand English, Hindi, Hinglish and Indian regional
languages.

Return ONLY one valid JSON object.
Do not explain your reasoning.
Do not use Markdown or code fences.

Required JSON:

{
  "business_category": null,
  "business_type": null,
  "employees": null,
  "monthly_budget": null,
  "needs": [],
  "language": "English",
  "missing_information": []
}

Rules:

1. Recognize clinics, shops, retail stores, offices,
   manufacturers and multi-site businesses.

2. Understand Hindi and Hinglish numbers.

3. Budget must be a numeric INR value.
4. Employees must be an integer.

5. Allowed needs:
   internet, email, security, voice, storage, iot.

6. Never invent missing information.

7. Do not recommend products or prices.

8. Identify the language used in the latest message.
   Use Hinglish for mixed Hindi-English Roman-script text.

9. Latest explicit user information overrides conflicting
   profile values.

10. If the meaning of a number is ambiguous, use null
    and explain the ambiguity in missing_information.

11. Do not treat patients, customers, visitors or orders
    as employees.

12. Return needs only when the user has expressed
    that requirement.
"""

    user_payload = {
        "message": message,
        "existing_profile": {
            "business_category": profile.get("business_category"),
            "business_type": profile.get("business_type"),
            "number_of_employees": profile.get("number_of_employees"),
            "monthly_budget": profile.get("monthly_budget"),
            "required_products": profile.get("required_products")
        }
    }

    messages = [
        {
            "role": "system",
            "content": system_prompt
        },
        {
            "role": "user",
            "content": json.dumps(
                user_payload,
                ensure_ascii=False
            )
        }
    ]

    response = await call_llm(
        messages,
        temperature=0,
        max_tokens=2048
    )

    try:
        start = response.find("{")
        end = response.rfind("}") + 1

        if start < 0 or end <= start:
            raise ValueError("No JSON object found")

        extracted = json.loads(response[start:end])

    except (json.JSONDecodeError, ValueError) as exc:

        print("[Requirement extraction response]", response)

        raise ValueError(
            f"Invalid requirement extraction response: {exc}"
        )

    if not isinstance(extracted, dict):
        raise ValueError(
            "AI response must be a JSON object"
        )

    extracted["language"] = normalize_language(
        extracted.get("language")
    )

    allowed_needs = {
        "internet",
        "email",
        "security",
        "voice",
        "storage",
        "iot"
    }

    raw_needs = extracted.get("needs", [])

    if not isinstance(raw_needs, list):
        raw_needs = []

    extracted["needs"] = [
        need.strip().lower()
        for need in raw_needs
        if isinstance(need, str)
        and need.strip().lower() in allowed_needs
    ]

    if not isinstance(
        extracted.get("missing_information"), list
    ):
        extracted["missing_information"] = []

    return extracted
