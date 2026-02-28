# https://pysource.com/2021/10/29/kalman-filter-predict-the-trajectory-of-an-object/

import cv2
import numpy as np


class KalmanFilter:

    def __init__(self):

        # Initialize Kalman Filter
        self.kf = cv2.KalmanFilter(4, 2)

        # Measurement Matrix
        self.kf.measurementMatrix = np.array([
            [1, 0, 0, 0],
            [0, 1, 0, 0]
        ], np.float32)

        # Transition Matrix
        self.kf.transitionMatrix = np.array([
            [1, 0, 1, 0],
            [0, 1, 0, 1],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ], np.float32)


    def predict(self, coordX, coordY):
        """Estimate the position of the object"""

        measured = np.array([
            [np.float32(coordX)],
            [np.float32(coordY)]
        ])

        # Correct with measurement
        self.kf.correct(measured)

        # Predict next state
        predicted = self.kf.predict()

        # Extract scalar values
        x = int(predicted[0][0])
        y = int(predicted[1][0])

        return x, y