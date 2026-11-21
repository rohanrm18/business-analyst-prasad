@echo off
setlocal
REM Change this URL only if Tally's XML/HTTP port differs from 9000.
set TALLY_URL=http://127.0.0.1:9000
set CONNECTOR_PORT=8765
python server.py
pause
