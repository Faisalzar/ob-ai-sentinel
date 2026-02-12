@echo off
REM Batch script to run Flask web app with automatic virtual environment activation

echo Starting Flask web application...
echo Open browser and go to: http://127.0.0.1:5000

REM Activate virtual environment and run Flask app
call venv_new\Scripts\activate.bat
python app.py
