import cv2
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
from orange_detector import OrangeDetector
from kalmanfilter import KalmanFilter

cap = cv2.VideoCapture(0)

# Load detector
od = OrangeDetector()

# Load Kalman filter to predict the trajectory
kf = KalmanFilter()

# Create a figure and axis for the live graph
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))

# Live graph setup
x_data_initial, y_data_initial = [], []
x_data_predicted, y_data_predicted = [], []
line_initial, = ax1.plot([], [], marker='o', linestyle='-', color='b', markersize=10, label='Initial Position')
line_predicted, = ax1.plot([], [], marker='o', linestyle='-', color='r', markersize=10, label='Predicted Position')

def init():
    ax1.set_xlim(0, 640)  # Assuming 640 as the width of the frame
    ax1.set_ylim(0, 480)  # Assuming 480 as the height of the frame
    ax2.set_xlim(0, 640)  # Assuming 640 as the width of the frame
    ax2.set_ylim(0, 480)  # Assuming 480 as the height of the frame
    ax1.legend()
    return line_initial, line_predicted

def update(frame):
    ret, frame = cap.read()
    if ret is False:
        ani.event_source.stop()

    orange_bbox = od.detect(frame)
    x, y, x2, y2 = orange_bbox
    cx = int((x + x2) / 2)
    cy = int((y + y2) / 2)

    predicted = kf.predict(cx, cy)

    x_data_initial.append(cx)
    y_data_initial.append(cy)
    x_data_predicted.append(predicted[0])
    y_data_predicted.append(predicted[1])

    line_initial.set_data(x_data_initial, y_data_initial)
    line_predicted.set_data(x_data_predicted, y_data_predicted)

    # Display the current frame with object detection
    ax2.clear()
    ax2.imshow(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    ax2.scatter(cx, cy, s=100, c='b', marker='o', label='Initial Point')
    ax2.scatter(predicted[0], predicted[1], s=100, c='r', marker='o', label='Predicted Point')
    ax2.set_title('Object Detection Frame')
    ax2.legend()

    plt.pause(0.001)  # Add a small pause to allow for display update

    return line_initial, line_predicted

ani = FuncAnimation(fig, update, init_func=init, blit=True)

plt.show()

cap.release()
cv2.destroyAllWindows()
