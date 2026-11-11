@echo off
echo Stopping Expense Manager Server on port 3333...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3333" ^| find "LISTENING"') do (
    taskkill /F /PID %%a
)
echo Done!
pause

