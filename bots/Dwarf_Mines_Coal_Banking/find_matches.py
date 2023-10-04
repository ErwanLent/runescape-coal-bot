import cv2
import sys
import numpy as np
import json
import traceback
import argparse

def find_matches(image_data, template_paths, threshold=0.8, colors=None, stop_on_first_match=False):
    # Convert the image data to an OpenCV image
    image = cv2.imdecode(np.frombuffer(image_data, np.uint8), cv2.IMREAD_UNCHANGED)

    # Load the templates
    templates = [cv2.imread(template_path, cv2.IMREAD_UNCHANGED) for template_path in template_paths]

    scale = args.scale if args.scale else 1
    templates = [cv2.resize(template, (int(template.shape[1] * scale), int(template.shape[0] * scale))) for template in templates]

    all_matches = []
    
    for template in templates:
        if image.shape[0] < template.shape[0] or image.shape[1] < template.shape[1]:
            print("Warning: Template is larger than source image. Skipping...")
            continue

        w, h = int(template.shape[1]), int(template.shape[0])

        # Use the template matching technique
        res = cv2.matchTemplate(image, template, cv2.TM_CCOEFF_NORMED)
        loc = np.where(res >= threshold)

        matches = [{"x": int(pt[0]), "y": int(pt[1]), "w": w, "h": h} for pt in zip(*loc[::-1])]
        all_matches.extend(matches)

        if stop_on_first_match and matches:
            break        

    # Remove duplicates based on position
    seen = set()
    unique_matches = []
    for match in all_matches:
        coord = (match["x"], match["y"])
        if coord not in seen:
            seen.add(coord)
            unique_matches.append(match)

    if colors:
        valid_matches = []
        for match in unique_matches:
            roi = image[match['y']:match['y']+match['h'], match['x']:match['x']+match['w']]
            is_color_present = False
            for color in colors:
                bgr_color = tuple(int(color[i:i+2], 16) for i in (4, 2, 0))
                if np.any(np.all(roi[:,:,:3] == bgr_color, axis=2)):
                    is_color_present = True
                    break
            if is_color_present:  # Only change made, from "not is_color_present" to "is_color_present"
                valid_matches.append(match)
        unique_matches = valid_matches

    return unique_matches


def is_touching_or_overlapping(rect1, rect2):
    x1, y1, w1, h1 = rect1['x'], rect1['y'], rect1['w'], rect1['h']
    x2, y2, w2, h2 = rect2['x'], rect2['y'], rect2['w'], rect2['h']

    return not (x1 + w1 < x2 or x2 + w2 < x1 or y1 + h1 < y2 or y2 + h2 < y1)

def remove_touching_rectangles(matches):
    while True:
        has_touch = False
        to_remove = set()

        for i in range(len(matches)):
            for j in range(i + 1, len(matches)):
                if is_touching_or_overlapping(matches[i], matches[j]):
                    to_remove.add(i)
                    has_touch = True
                    break

            if has_touch:
                break

        # Remove the touching rectangles
        matches = [match for idx, match in enumerate(matches) if idx not in to_remove]

        if not has_touch:
            break

    return matches


if __name__ == "__main__":
    try:
        parser = argparse.ArgumentParser()
        parser.add_argument('--templates', nargs='+', required=True, help='Paths to the template images.')
        parser.add_argument('--threshold', type=float, required=True, help='Matching threshold.')
        parser.add_argument('--colors', nargs='*', default=[], help='Colors to filter by.')
        parser.add_argument('--scale', type=float, help='Scale factor for resizing the templates')
        parser.add_argument('--stop_on_first_match', action='store_true', help='Stop on the first match found')
        args = parser.parse_args()

        # Read the image data from stdin
        image_data = sys.stdin.buffer.read()

        all_matches = find_matches(image_data, args.templates, args.threshold, args.colors, args.stop_on_first_match)
        filtered_matches = remove_touching_rectangles(all_matches)
        output = {
            "pre_filter_count": len(all_matches),
            "filtered_matches": filtered_matches
        }
        print(json.dumps(output))
    except Exception as e:
        print({"error": str(e), "trace": traceback.format_exc()}, file=sys.stderr) 