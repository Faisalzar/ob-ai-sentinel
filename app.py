# app.py

from flask import Flask, Response
import cv2
import threading
from inference_sdk import InferenceHTTPClient

# --- Configuration ---
ROBOFLOW_API_KEY = "eWF4mOSpEQVguHZ4QiU2" 
MODEL_ID = "gun-detection-vxfip/2" 
CONFIDENCE_THRESHOLD = 0.40
# --------------------

# --- Backend AI Logic (from our previous script) ---
latest_frame = None
latest_predictions = []
lock = threading.Lock()
is_running = True

def run_inference():
    global latest_frame, latest_predictions, is_running
    CLIENT = InferenceHTTPClient(api_url="https://detect.roboflow.com", api_key=ROBOFLOW_API_KEY)
    
    while is_running:
        frame_to_process = None
        with lock:
            if latest_frame is not None:
                frame_to_process = latest_frame.copy()
        
        if frame_to_process is not None:
            try:
                result = CLIENT.infer(frame_to_process, model_id=MODEL_ID)
                with lock:
                    latest_predictions = result.get('predictions', [])
            except Exception as e:
                print(f"Error during inference: {e}")

# --- Web Application Logic ---
app = Flask(__name__)
cap = cv2.VideoCapture(0)

@app.route('/')
def index():
    # This is the main page of our web app
    return """
    <html>
        <head>
            <title>Live AI Security Feed</title>
        </head>
        <body>
            <h1>AI-Powered Live Security Feed</h1>
            <img src="/video_feed">
        </body>
    </html>
    """

def generate_frames():
    global latest_frame, latest_predictions
    while True:
        success, frame = cap.read()
        if not success:
            break
        else:
            with lock:
                latest_frame = frame
                current_predictions = latest_predictions

            for prediction in current_predictions:
                confidence = prediction['confidence']
                if confidence >= CONFIDENCE_THRESHOLD:
                    # Drawing logic remains the same
                    x, y, width, height = int(prediction['x']), int(prediction['y']), int(prediction['width']), int(prediction['height'])
                    label = prediction['class']
                    x1, y1, x2, y2 = x - width // 2, y - height // 2, x + width // 2, y + height // 2
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                    cv2.putText(frame, f"{label}: {confidence:.2f}", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

            ret, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()
            # Yield the frame in a special format for streaming
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    # Start the background inference thread
    inference_thread = threading.Thread(target=run_inference)
    inference_thread.daemon = True
    inference_thread.start()
    
    # Start the Flask web server
    app.run(debug=True, threaded=True, use_reloader=False)

    # Cleanup
    is_running = False
    inference_thread.join()
    cap.release()