import sys
import cv2
import numpy as np


def detect_refined_compass_direction(image_buffer):
    # Load the image from buffer
    image = cv2.imdecode(np.frombuffer(
        image_buffer, np.uint8), cv2.IMREAD_COLOR)

    # Convert the image to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Apply adaptive thresholding to binarize the image
    thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                   cv2.THRESH_BINARY_INV, 11, 2)

    # Detect the contours
    contours, _ = cv2.findContours(
        thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Filter out larger contours to focus on the smaller ones (likely to be the moving compass needle)
    contours = [contour for contour in contours if 100 <
                cv2.contourArea(contour) < 500]

    # Find the contour that corresponds to the compass needle
    needle_contour = max(contours, key=cv2.contourArea)

    # Compute the center of the image
    center_x_img = image.shape[1] // 2
    center_y_img = image.shape[0] // 2

    # Find the point on the needle contour that is farthest from the center of the image
    farthest_point = max(needle_contour, key=lambda point: cv2.norm(
        point - [center_x_img, center_y_img]))
    farthest_x, farthest_y = farthest_point[0]

    # Compute the angle between the center of the image and the farthest point on the needle contour
    delta_x = farthest_x - center_x_img
    delta_y = center_y_img - farthest_y  # The image's y-axis is inverted
    angle_rad = np.arctan2(delta_y, delta_x)
    angle_deg = np.degrees(angle_rad)

    # Adjust the angle to be in the range [0, 360)
    adjusted_angle = (90 - angle_deg) % 360

    return adjusted_angle


if __name__ == "__main__":
    image_data = sys.stdin.buffer.read()
    angle = detect_refined_compass_direction(image_data)
    print(angle)
