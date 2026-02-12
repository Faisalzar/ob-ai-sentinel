@echo off
REM Batch script to run object detection with automatic virtual environment activation

if "%~1"=="" (
    echo Usage: detect.bat ^<image_path^>
    echo Example: detect.bat tr.jpg
    exit /b 1
)

REM Activate virtual environment and run detection
call venv_new\Scripts\activate.bat
python detect_image.py %*
