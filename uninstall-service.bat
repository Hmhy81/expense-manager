@echo off
cd /d "%~dp0"
echo Uninstalling Expense Manager Windows Background Service...
node uninstall-service.js
pause

