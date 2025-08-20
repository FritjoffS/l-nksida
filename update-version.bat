@echo off
REM Version Update Script för Sollebrunns Järnhandel PWA
REM Använd: update-version.bat 2.1.0 "Ny funktionalitet tillagd"

if "%1"=="" (
    echo Använd: update-version.bat [VERSION] "[BESKRIVNING]"
    echo Exempel: update-version.bat 2.1.0 "Husqvarna genväg tillagd"
    pause
    exit /b 1
)

set NEW_VERSION=%1
set DESCRIPTION=%2

echo.
echo === Uppdaterar version till %NEW_VERSION% ===
echo.

REM Visa vad som behöver uppdateras
echo Filer som behöver uppdateras manuellt:
echo - manifest.json: "version": "%NEW_VERSION%"
echo - sw.js: CACHE_NAME = 'jarnhandel-v%NEW_VERSION%'
echo - index/index.html: Version display
echo - CHANGELOG.md: Lägg till ny sektion
echo.

echo Öppnar filer för redigering...
notepad manifest.json
notepad sw.js
notepad index\index.html
notepad CHANGELOG.md

echo.
echo ✅ Kom ihåg att:
echo 1. Uppdatera version i alla filer
echo 2. Testa PWA-funktionaliteten
echo 3. Committa ändringarna
echo 4. Pusha till GitHub
echo.
pause
