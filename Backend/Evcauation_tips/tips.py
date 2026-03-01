import os
import base64
from fastapi import APIRouter, UploadFile, File, Form
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

router = APIRouter()

# ==========================
# GROQ CONFIG
# ==========================

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

client = Groq(
    api_key=GROQ_API_KEY
)

# ==========================
# HELPER FUNCTION
# ==========================

def encode_image(file_bytes):
    return base64.b64encode(file_bytes).decode("utf-8")


# ==========================
# AI EVACUATION ANALYSIS
# ==========================

async def generate_evacuation_tips(image_bytes, user_prompt):

    base64_image = encode_image(image_bytes)

    response = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an AI disaster management assistant. "
                    "Analyze images and provide evacuation guidance for emergencies "
                    "such as fires, floods, earthquakes, building collapse, or crowd panic."
                )
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": f"""
Analyze the image and provide evacuation guidance.

User context:
{user_prompt}

Provide:
1. Immediate danger assessment
2. Safe evacuation steps
3. Things to avoid
4. Emergency tips
"""
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    }
                ]
            }
        ],
        temperature=0.3,
        max_tokens=700
    )

    return response.choices[0].message.content


# ==========================
# FASTAPI ROUTE
# ==========================

@router.post("/evacuation-tips")
async def evacuation_tips(
    prompt: str = Form(...),
    image: UploadFile = File(...)
):

    image_bytes = await image.read()

    ai_response = await generate_evacuation_tips(
        image_bytes=image_bytes,
        user_prompt=prompt
    )

    return {
        "ai_evacuation_advice": ai_response
    }