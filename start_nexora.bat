@echo off
echo ==================================================
echo NEXORA SERVER STARTUP
echo ==================================================

echo.
echo [1/3] Checking environment...
if exist venv\Scripts\activate.bat (
    echo [INFO] Activating venv virtual environment...
    call venv\Scripts\activate.bat
) else if exist .venv\Scripts\activate.bat (
    echo [INFO] Activating .venv virtual environment...
    call .venv\Scripts\activate.bat
) else (
    echo [WARNING] No venv or .venv directory found. Using global python environment.
)

echo.
echo [2/3] Starting backend server on port 8000...
echo [INFO] The server will also serve the frontend files at http://localhost:8000/
echo.

:: We will open the browser in 2 seconds
start /B cmd /C "ping 127.0.0.1 -n 3 > nul && start http://127.0.0.1:8000/pages/login.html"

echo [3/3] Running Uvicorn...
echo.
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000

echo.
pause
