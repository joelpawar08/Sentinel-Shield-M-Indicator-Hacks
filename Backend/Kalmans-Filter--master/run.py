import tkinter as tk
import cv2
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from matplotlib.animation import FuncAnimation
from PIL import Image, ImageTk
import socket
import requests
import pygame
import geocoder

from orange_detector import OrangeDetector
from kalmanfilter import KalmanFilter


cap = cv2.VideoCapture("ball.mp4")

od = OrangeDetector()
kf = KalmanFilter()

pygame.mixer.init()
pygame.mixer.music.load("siren.mpeg")

prev_y = None
siren_on = False

x_data_initial=[]
y_data_initial=[]

x_data_pred=[]
y_data_pred=[]


root=tk.Tk()
root.title("Sentinel Shield Defense Dashboard")
root.geometry("1600x900")
root.configure(bg="#0b132b")

title=tk.Label(root,
text="Sentinel Shield Defense Monitoring System",
font=("Arial",26,"bold"),
fg="#00ffe1",
bg="#0b132b")

title.pack(pady=10)


main=tk.Frame(root,bg="#0b132b")
main.pack(fill="both",expand=True)

main.rowconfigure((0,1),weight=1)
main.columnconfigure((0,1),weight=1)


# =======================
# FRAME 1 VIDEO
# =======================

video_frame=tk.Frame(main,bg="#1c2541",bd=3,relief="ridge")
video_frame.grid(row=0,column=0,sticky="nsew",padx=10,pady=10)

video_label=tk.Label(video_frame)
video_label.pack(expand=True)


# =======================
# FRAME 2 GRAPH
# =======================

graph_frame=tk.Frame(main,bg="#1c2541",bd=3,relief="ridge")
graph_frame.grid(row=0,column=1,sticky="nsew",padx=10,pady=10)

fig,ax=plt.subplots(figsize=(5,4))

line_initial,=ax.plot([],[],color="blue",marker="o",label="Initial")
line_pred,=ax.plot([],[],color="red",marker="o",label="Predicted")

ax.set_xlim(0,640)
ax.set_ylim(0,480)

ax.legend()

canvas=FigureCanvasTkAgg(fig,master=graph_frame)
canvas.get_tk_widget().pack(expand=True)


# =======================
# FRAME 3 RADAR
# =======================

radar_frame=tk.Frame(main,bg="#1c2541",bd=3,relief="ridge")
radar_frame.grid(row=1,column=0,sticky="nsew",padx=10,pady=10)

radar=tk.Canvas(radar_frame,width=400,height=400,bg="black")
radar.pack(expand=True)


# =======================
# FRAME 4 INFO PANEL
# =======================

info_frame=tk.Frame(main,bg="#1c2541",bd=3,relief="ridge")
info_frame.grid(row=1,column=1,sticky="nsew",padx=10,pady=10)


coord_label=tk.Label(info_frame,
text="Object Location: ",
font=("Arial",14),
fg="white",
bg="#1c2541")

coord_label.pack(pady=10)


status_label=tk.Label(info_frame,
text="STATUS : SAFE",
font=("Arial",16,"bold"),
fg="lime",
bg="#1c2541")

status_label.pack(pady=10)


def get_ip():
    hostname=socket.gethostname()
    return socket.gethostbyname(hostname)


ip_label=tk.Label(info_frame,
text="IP : "+get_ip(),
fg="cyan",
bg="#1c2541")

ip_label.pack()


def get_location():
    try:
        g=geocoder.ip("me")
        return str(g.latlng)
    except:
        return "Unknown"


location_label=tk.Label(info_frame,
text="Attack Location: "+get_location(),
fg="yellow",
bg="#1c2541")

location_label.pack(pady=10)


def send_alert():
    try:
        requests.post("http://127.0.0.1:8000/danger")
    except:
        pass


def manual_alert():

    pygame.mixer.music.play(-1)
    send_alert()

    status_label.config(text="MANUAL ALERT",fg="red")


alert_btn=tk.Button(info_frame,
text="MANUAL ALERT",
bg="red",
fg="white",
font=("Arial",14,"bold"),
command=manual_alert)

alert_btn.pack(pady=20)


# =======================
# RADAR DRAW
# =======================

def draw_radar(x,y):

    radar.delete("all")

    cx=200
    cy=200

    for r in range(50,200,50):
        radar.create_oval(cx-r,cy-r,cx+r,cy+r,outline="green")

    radar.create_line(0,200,400,200,fill="green")
    radar.create_line(200,0,200,400,fill="green")

    rx=int(x/640*400)
    ry=int(y/480*400)

    radar.create_oval(rx-5,ry-5,rx+5,ry+5,fill="red")


# =======================
# UPDATE LOOP
# =======================

def update(frame):

    global prev_y,siren_on

    ret,frame=cap.read()

    if not ret:
        return

    bbox=od.detect(frame)

    if bbox is None:
        return

    x,y,x2,y2=bbox

    cx=int((x+x2)/2)
    cy=int((y+y2)/2)

    pred=kf.predict(cx,cy)

    # draw bounding box
    cv2.rectangle(frame,(x,y),(x2,y2),(0,255,0),2)

    # INITIAL POINT (BLUE)
    cv2.circle(frame,(cx,cy),6,(255,0,0),-1)

    # PREDICTED POINT (RED)
    cv2.circle(frame,(pred[0],pred[1]),6,(0,0,255),-1)

    if prev_y is not None:

        if cy>prev_y:

            if not siren_on:

                pygame.mixer.music.play(-1)
                siren_on=True

                send_alert()

                status_label.config(text="STATUS : DANGER",fg="red")

        if cy<prev_y:

            if siren_on:

                pygame.mixer.music.stop()
                siren_on=False

                status_label.config(text="STATUS : SAFE",fg="lime")

    prev_y=cy


    x_data_initial.append(cx)
    y_data_initial.append(cy)

    x_data_pred.append(pred[0])
    y_data_pred.append(pred[1])

    line_initial.set_data(x_data_initial,y_data_initial)
    line_pred.set_data(x_data_pred,y_data_pred)

    canvas.draw()

    coord_label.config(text=f"Object Location: {cx},{cy}")

    draw_radar(cx,cy)


    frame=cv2.cvtColor(frame,cv2.COLOR_BGR2RGB)

    img=Image.fromarray(frame)
    imgtk=ImageTk.PhotoImage(img)

    video_label.imgtk=imgtk
    video_label.configure(image=imgtk)


ani=FuncAnimation(fig,update,interval=50)

root.mainloop()