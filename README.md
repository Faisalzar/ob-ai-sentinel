# AI Object Detection Engine

This project is a real-time, multi-model object detection system.

## How to Run

1.  **Create a Virtual Environment:**
    * Make sure you have Python 3.11 installed.
    * Run this command in the terminal: `py -3.11 -m venv venv_new`

2.  **Activate the Environment:**
    * Run: `.\venv_new\Scripts\activate`

3.  **Install Required Libraries:**
    * Run: `pip install -r requirements.txt`

4.  **Add API Key:**
    * Open the `live_multi_model.py` file.
    * Find the line `ROBOFLOW_API_KEY = "YOUR_API_KEY_HERE"` and replace the placeholder with your own private API key from Roboflow.  (my API key eWF4mOSpEQVguHZ4QiU2)
 
5.  **Run the Program:**
    * Run the main script: `python live_multi_model.py`