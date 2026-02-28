import cv2
import numpy as np

# Function to predict projectile trajectory
def projectile_trajectory(initial_position, initial_velocity, angle, gravity, time_interval):
    # ... (same as previous code)

# Example usage
  cap = cv2.VideoCapture(0)

# Check if the webcam is opened successfully
if not cap.isOpened():
    print("Error: Could not open webcam.")
    exit()

# Initialize trajectory points
trajectory_points = []

while True:
    ret, frame = cap.read()

    # Check if the frame reading was successful
    if not ret:
        print("Error: Failed to read frame from the webcam.")
        break

    # Assuming the center of the frame as the initial position
    initial_position = (frame.shape[1] // 2, frame.shape[0] // 2)

    # Predict projectile trajectory
    x_values, y_values = projectile_trajectory(initial_position, initial_velocity, angle, gravity, time_interval)

    # Store the trajectory points
    trajectory_points.extend(list(zip(x_values, y_values)))

    # Draw the trajectory on the frame
    for i in range(1, len(trajectory_points)):
        cv2.line(frame, tuple(map(int, trajectory_points[i - 1])), tuple(map(int, trajectory_points[i])), (0, 255, 0), 2)

    # Display the frame with trajectory
    cv2.imshow('Trajectory', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
