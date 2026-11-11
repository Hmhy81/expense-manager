@echo off
title Expense Manager (Production Mode)
cd /d "D:\wamp64\www\nodejs\expense-manager"
echo Starting Expense Manager on port 3333...
node build/bin/server.js
pause

