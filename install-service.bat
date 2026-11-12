@echo off
cd /d "%~dp0"
echo Installing Expense Manager as a Windows Background Service...
node install-service.js
pause

