@echo off
curl.exe -X POST http://localhost:3000/api/allocate -H "Content-Type: application/json" -d @allocate_payload.json
