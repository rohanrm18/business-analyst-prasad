@echo off
setlocal
cd /d "%~dp0"

REM Tally.ERP 9 is running locally on port 9000.
set "TALLY_URL=http://127.0.0.1:9000"
set "CONNECTOR_PORT=8765"

if not exist "%~dp0server.py" (
  echo ERROR: server.py is not in this folder:
  echo %~dp0
  echo Keep start-connector.bat and server.py together in the connector folder.
  pause
  exit /b 1
)

set "PYTHON_EXE="

REM Known Python installation on this PC.
if exist "%LocalAppData%\Programs\Python\Python314\python.exe" set "PYTHON_EXE=%LocalAppData%\Programs\Python\Python314\python.exe"

REM Fallback to the Python launcher if available.
if not defined PYTHON_EXE (
  where py >nul 2>nul
  if not errorlevel 1 set "PYTHON_EXE=py -3"
)

if not defined PYTHON_EXE (
  echo ERROR: Python was not found. Install Python 3 and try again.
  pause
  exit /b 1
)

echo Starting Prasad Business Analyst Tally connector...
echo Tally: %TALLY_URL%
echo Local status page: http://127.0.0.1:8765/api/tally/status
"%PYTHON_EXE%" "%~dp0server.py"
pause
