@echo off
REM Batch script to run live detection with automatic virtual environment activation

echo Starting live object detection...
echo Press 'q' to quit

REM Activate virtual environment and run live detection
call venv_new\Scripts\activate.bat
python live_multi_model.py
