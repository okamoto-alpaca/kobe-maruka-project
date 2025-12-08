@echo off
curl.exe -X POST http://localhost:3000/api/ingest -H "Content-Type: application/json" -d "{\"imageBase64\": \"TEST_IMAGE_DATA\"}"
echo.
pause
