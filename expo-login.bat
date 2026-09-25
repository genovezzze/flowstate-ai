@echo off
cd /d "%~dp0"
title FlowState - Expo login
echo Sign in with your Expo account (create one free at https://expo.dev/signup).
echo Use the SAME account in the Expo Go app on your iPhone.
echo.
call npx expo login
echo.
echo Done. Now close the old tunnel window and run start-tunnel.bat again.
pause
