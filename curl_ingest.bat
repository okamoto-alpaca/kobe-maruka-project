@echo off
curl -X POST http://localhost:3000/api/ingest -H "Content-Type: application/json" -d @payload.json
echo.
pause
