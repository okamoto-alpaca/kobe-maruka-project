@echo off
REM Using curl.exe explicitly to avoid PowerShell alias issues
curl.exe -X POST http://localhost:3000/api/allocate -H "Content-Type: application/json" -d "{\"supplyId\": \"7ca12d79-0730-4101-b0a5-a4075c36dc14\", \"customerName\": \"TestCustomer\", \"quantity\": 5}"
echo.
pause
