import cv2
import numpy as np


def projectile_trajectory(initial_position, initial_velocity, angle, gravity, time_interval):
    


  cap = cv2.VideoCapture(0)

  if not cap.isOpened():
    print("Error: Could not Open Webcam")
    exit()

trajectory_points=[]

while True:
   ret, frame = cap.read()

   if not ret:
     print("Error: Failed to read the frame from the webcam")
     break 


initial_position = (frame.shape[1] // 2, frame.shape[0] // 2)


x_values, y_values = projectile_trajectory(initial_position, initial_velocity, angle, gravity, time_interval)

    
trajectory_points.extend(list(zip(x_values, y_values)))
   


for i in range(1, len(trajectory_points)):
        cv2.line(frame, tuple(map(int, trajectory_points[i - 1])), tuple(map(int, trajectory_points[i])), (0, 255, 0), 2)


        cv2.imshow('Trajectory', frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
               break
        
        
cap.release()
cv2.destroyAllWindows()

       


  