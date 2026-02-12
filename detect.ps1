# PowerShell script to run object detection with automatic virtual environment activation

param(
    [Parameter(Mandatory=$true)]
    [string]$ImagePath
)

# Activate virtual environment and run detection
& ".\venv_new\Scripts\Activate.ps1"
python detect_image.py $ImagePath
