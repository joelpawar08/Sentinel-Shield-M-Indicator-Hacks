import tkinter as tk
from tkinter import ttk
import cv2
from PIL import Image, ImageTk
import numpy as np
import math

class MissileDashboard:

    def __init__(self, root):

        self.root = root
        self.root.title("Sentinel Shield - Defense Monitoring System")
        self.root.geometry("1400x900")
        self.root.configure(bg="#0a0f1c")

        self.video_frame = None

        self.cx = 0
        self.cy = 0

        self.create_layout()

        self.cap = cv2.VideoCapture("ball.mp4")

        self.update_video()
        self.update_radar()


    def create_layout(self):

        title = tk.Label(
            self.root,
            text="Sentinel Shield Admin Dashboard",
            font=("Orbitron", 26, "bold"),
            fg="#00ffe1",
            bg="#0a0f1c"
        )

        title.pack(pady=10)

        main_frame = tk.Frame(self.root, bg="#0a0f1c")
        main_frame.pack(fill="both", expand=True)

        # LEFT SIDE VIDEO
        left_panel = tk.Frame(main_frame, bg="#10182b", bd=2, relief="ridge")
        left_panel.pack(side="left", fill="both", expand=True, padx=10, pady=10)

        tk.Label(
            left_panel,
            text="Live Object Tracking",
            font=("Arial", 16, "bold"),
            fg="white",
            bg="#10182b"
        ).pack(pady=5)

        self.video_label = tk.Label(left_panel)
        self.video_label.pack()

        # RIGHT PANEL
        right_panel = tk.Frame(main_frame, bg="#10182b", bd=2, relief="ridge")
        right_panel.pack(side="right", fill="both", expand=True, padx=10, pady=10)

        # RADAR
        tk.Label(
            right_panel,
            text="Radar Tracking",
            font=("Arial", 16, "bold"),
            fg="white",
            bg="#10182b"
        ).pack(pady=5)

        self.radar_canvas = tk.Canvas(
            right_panel,
            width=400,
            height=400,
            bg="#02060f",
            highlightthickness=0
        )

        self.radar_canvas.pack()

        # COORDINATES
        coord_frame = tk.Frame(right_panel, bg="#10182b")
        coord_frame.pack(pady=10)

        tk.Label(coord_frame, text="Object X:", fg="white", bg="#10182b").grid(row=0, column=0)
        self.x_label = tk.Label(coord_frame, text="0", fg="#00ffe1", bg="#10182b")
        self.x_label.grid(row=0, column=1)

        tk.Label(coord_frame, text="Object Y:", fg="white", bg="#10182b").grid(row=1, column=0)
        self.y_label = tk.Label(coord_frame, text="0", fg="#00ffe1", bg="#10182b")
        self.y_label.grid(row=1, column=1)

        # STATUS
        self.status_label = tk.Label(
            right_panel,
            text="STATUS : SAFE",
            font=("Arial", 16, "bold"),
            fg="#00ff9f",
            bg="#10182b"
        )

        self.status_label.pack(pady=20)


    def update_video(self):

        ret, frame = self.cap.read()

        if ret:

            frame = cv2.resize(frame, (640, 480))

            hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

            lower = np.array([5, 100, 100])
            upper = np.array([15, 255, 255])

            mask = cv2.inRange(hsv, lower, upper)

            contours, _ = cv2.findContours(mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

            if contours:

                c = max(contours, key=cv2.contourArea)

                x, y, w, h = cv2.boundingRect(c)

                self.cx = x + w // 2
                self.cy = y + h // 2

                cv2.circle(frame, (self.cx, self.cy), 10, (0,0,255), -1)

                self.x_label.config(text=str(self.cx))
                self.y_label.config(text=str(self.cy))

                if self.cy > 300:
                    self.status_label.config(text="STATUS : DANGER", fg="red")
                else:
                    self.status_label.config(text="STATUS : SAFE", fg="#00ff9f")

            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            img = Image.fromarray(frame)

            imgtk = ImageTk.PhotoImage(image=img)

            self.video_label.imgtk = imgtk
            self.video_label.configure(image=imgtk)

        self.root.after(30, self.update_video)


    def update_radar(self):

        self.radar_canvas.delete("all")

        cx = 200
        cy = 200

        # Radar circles
        for r in range(50, 200, 50):
            self.radar_canvas.create_oval(cx-r, cy-r, cx+r, cy+r, outline="#00ff9f")

        # cross lines
        self.radar_canvas.create_line(0,200,400,200, fill="#00ff9f")
        self.radar_canvas.create_line(200,0,200,400, fill="#00ff9f")

        # object position
        rx = int(self.cx / 640 * 400)
        ry = int(self.cy / 480 * 400)

        self.radar_canvas.create_oval(
            rx-5,
            ry-5,
            rx+5,
            ry+5,
            fill="red"
        )

        self.root.after(100, self.update_radar)


root = tk.Tk()

app = MissileDashboard(root)

root.mainloop()