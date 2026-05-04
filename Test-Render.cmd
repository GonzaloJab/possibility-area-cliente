@echo off
:: Set the window title
title Render API Service Manager

:: --- CONFIGURATION ---
:: Replace the placeholder below with your actual Render API Key
set "RENDER_TOKEN=rnd_QeSF4BCmcfM93K9Pp9NiP7dDzJRt"
set "ENDPOINT=https://api.render.com/v1/services?limit=20"

echo ====================================================
echo  CONNECTING TO RENDER.COM
echo ====================================================
echo.

:: --- EXECUTION ---
:: Using curl to fetch the JSON data
curl --request GET ^
     --url "%ENDPOINT%" ^
     --header "Accept: application/json" ^
     --header "Authorization: Bearer %RENDER_TOKEN%"

:: --- ERROR CHECKING ---
:: In a .cmd file, success resets the ERRORLEVEL to 0 immediately.
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] The API request failed with code: %ERRORLEVEL%
    goto :end
)

echo.
echo.
echo ====================================================
echo  REQUEST SUCCESSFUL
echo ====================================================

:end
echo.
echo Press any key to exit...
pause > nul