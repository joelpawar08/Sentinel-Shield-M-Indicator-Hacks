from fastapi import FastAPI

app = FastAPI()

danger_zone = False


@app.post("/danger")
def danger_trigger():

    global danger_zone

    danger_zone = True

    return {
        "alert": "danger zone activated"
    }


@app.get("/danger-status")
def get_status():

    return {
        "danger_zone": danger_zone
    }