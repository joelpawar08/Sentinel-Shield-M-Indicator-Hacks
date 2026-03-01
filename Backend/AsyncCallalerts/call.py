import asyncio
import os
from datetime import datetime
from twilio.rest import Client
from dotenv import load_dotenv
import os

load_dotenv()

# ==============================
# Twilio Credentials
# ==============================

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")

# ==============================
# Alert Numbers
# ==============================

TARGET_NUMBERS = [
    os.getenv("ALERT_PHONE_1"),
    os.getenv("ALERT_PHONE_2"),
    os.getenv("ALERT_PHONE_3"),
    os.getenv("ALERT_PHONE_4")

]

# ==============================
# Configurations
# ==============================

CALL_REPEAT_COUNT = 5
CALL_INTERVAL_SECONDS = 30

# ==============================
# Twilio Client
# ==============================

client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)


# ==============================
# Async Call Function
# ==============================

async def make_call(to_number):
    """
    Initiates a phone call
    """
    loop = asyncio.get_running_loop()

    try:
        call = await loop.run_in_executor(
            None,
            lambda: client.calls.create(
                to=to_number,
                from_=TWILIO_PHONE_NUMBER,
                twiml="""
                <Response>
                    <Say voice="alice">
                        Emergency alert triggered.
                        Please check the monitoring system immediately.
                    </Say>
                </Response>
                """
            )
        )

        print(f"[{datetime.now()}] Call initiated to {to_number} | SID: {call.sid}")

    except Exception as e:
        print(f"[{datetime.now()}] Call failed for {to_number} : {e}")


# ==============================
# Async SMS Function
# ==============================

async def send_sms(to_number):
    """
    Sends alert SMS
    """
    loop = asyncio.get_running_loop()

    try:
        message = await loop.run_in_executor(
            None,
            lambda: client.messages.create(
                body="🚨 ALERT: Emergency detected! Please check the monitoring system immediately.",
                from_=TWILIO_PHONE_NUMBER,
                to=to_number
            )
        )

        print(f"[{datetime.now()}] SMS sent to {to_number} | SID: {message.sid}")

    except Exception as e:
        print(f"[{datetime.now()}] SMS failed for {to_number} : {e}")


# ==============================
# Parallel Alert Trigger
# ==============================

async def trigger_alert_for_number(number):
    """
    Sends SMS and call simultaneously to one number
    """
    await asyncio.gather(
        make_call(number),
        send_sms(number)
    )


# ==============================
# Parallel Execution For All
# ==============================

async def alert_all_people():
    """
    Runs alerts for all numbers simultaneously
    """
    tasks = [
        trigger_alert_for_number(num)
        for num in TARGET_NUMBERS
        if num
    ]

    await asyncio.gather(*tasks)


# ==============================
# Main Alert Loop
# ==============================

async def start_alert_calls():
    """
    Repeating alert system
    """

    print("🚨 Starting Async Emergency Alert System")

    for attempt in range(CALL_REPEAT_COUNT):

        print(f"\n===== ALERT ROUND {attempt + 1}/{CALL_REPEAT_COUNT} =====")

        await alert_all_people()

        if attempt < CALL_REPEAT_COUNT - 1:
            print(f"⏳ Waiting {CALL_INTERVAL_SECONDS} seconds before next alert...")
            await asyncio.sleep(CALL_INTERVAL_SECONDS)

    print("\n✅ Alert process completed.")


# ==============================
# Run Script
# ==============================

if __name__ == "__main__":
    asyncio.run(start_alert_calls())