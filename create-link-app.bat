@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo   Skapa ny Link-App sida
echo ========================================
echo.

:: Fråga efter mappnamn
set /p "FOLDER=Ange mappnamn (t.ex. lager): "
if "%FOLDER%"=="" (
    echo Fel: Du måste ange ett mappnamn!
    pause
    exit /b 1
)

:: Fråga efter visningsnamn
set /p "TITLE=Ange visningsnamn (t.ex. Lager): "
if "%TITLE%"=="" set "TITLE=%FOLDER%"

:: Fråga efter emoji
set /p "EMOJI=Ange emoji (t.ex. 📦): "
if "%EMOJI%"=="" set "EMOJI=📦"

:: Fråga efter beskrivning
set /p "DESC=Ange beskrivning för aria-label (t.ex. Lagerlänkar): "
if "%DESC%"=="" set "DESC=%TITLE%länkar"

echo.
echo ----------------------------------------
echo Skapar: %FOLDER%/
echo Titel: %TITLE%
echo Emoji: %EMOJI%
echo Beskrivning: %DESC%
echo ----------------------------------------
echo.

:: Skapa mappen
if not exist "%FOLDER%" (
    mkdir "%FOLDER%"
    echo [OK] Mapp skapad: %FOLDER%/
) else (
    echo [INFO] Mappen %FOLDER%/ finns redan
)

:: Skapa JavaScript-filen
(
echo /**
echo  * %TITLE% länk-app
echo  * Använder gemensam link-app modul
echo  */
echo import { initLinkApp } from '../scripts/link-app.js';
echo.
echo initLinkApp^({
echo   dbPath: '%FOLDER%',
echo   title: '%TITLE%',
echo   emptyIcon: '%EMOJI%'
echo }^);
) > "%FOLDER%\%FOLDER%.js"
echo [OK] Skapade: %FOLDER%/%FOLDER%.js

:: Skapa HTML-filen
(
echo ^<!DOCTYPE html^>
echo ^<html lang="sv"^>
echo.
echo ^<head^>
echo   ^<meta charset="UTF-8" /^>
echo   ^<meta name="viewport" content="width=device-width, initial-scale=1.0" /^>
echo   ^<meta name="author" content="Fredrik Söderberg" /^>
echo   ^<title^>%TITLE%^</title^>
echo.
echo   ^<!-- PWA Meta Tags --^>
echo   ^<link rel="manifest" href="../manifest.json" /^>
echo   ^<meta name="theme-color" content="#ff6600" /^>
echo   ^<meta name="apple-mobile-web-app-capable" content="yes" /^>
echo   ^<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" /^>
echo   ^<meta name="apple-mobile-web-app-title" content="Järnhandel" /^>
echo   ^<link rel="apple-touch-icon" href="../logo.png" /^>
echo   ^<meta name="mobile-web-app-capable" content="yes" /^>
echo   ^<meta name="application-name" content="Järnhandel" /^>
echo   ^<link rel="icon" type="image/png" sizes="192x192" href="../images/logo_rund.png" /^>
echo   ^<link rel="icon" type="image/png" sizes="512x512" href="../logo.png" /^>
echo.
echo   ^<link rel="stylesheet" href="../styles/global.css" /^>
echo   ^<link rel="stylesheet" href="../styles/navbar.css" /^>
echo   ^<link rel="stylesheet" href="../styles/link-app.css" /^>
echo.
echo   ^<!-- Google Analytics --^>
echo   ^<script type="module" src="../scripts/analytics.js" async^>^</script^>
echo ^</head^>
echo.
echo ^<body^>
echo   ^<!-- Loading overlay --^>
echo   ^<div id="loadingOverlay" role="alert" aria-live="polite"^>
echo     ^<div class="spinner"^>^</div^>
echo     ^<p^>Laddar %DESC%...^</p^>
echo   ^</div^>
echo.
echo   ^<div id="navbar" role="navigation" aria-label="Huvudnavigering"^>^</div^>
echo.
echo   ^<main role="main"^>
echo     ^<!-- Action bar --^>
echo     ^<div class="action-bar"^>
echo       ^<button class="add-link-btn" id="addLinkBtn" title="Lägg till ny länk"^>
echo         ➕ ^<span^>Lägg till länk^</span^>
echo       ^</button^>
echo     ^</div^>
echo.
echo     ^<div class="container" id="buttonContainer" role="list" aria-label="%DESC%"^>
echo       ^<!-- Dynamic buttons will be loaded here --^>
echo     ^</div^>
echo   ^</main^>
echo.
echo   ^<!-- Add/Edit Link Modal --^>
echo   ^<div class="modal" id="linkModal" role="dialog" aria-modal="true" aria-labelledby="modalTitle"^>
echo     ^<div class="modal-content"^>
echo       ^<div class="modal-header"^>
echo         ^<h2 id="modalTitle"^>Lägg till länk^</h2^>
echo         ^<button class="close-btn" id="closeModalBtn" aria-label="Stäng"^>^&times;^</button^>
echo       ^</div^>
echo       ^<form id="linkForm"^>
echo         ^<div class="form-group"^>
echo           ^<label for="linkName"^>Benämning *^</label^>
echo           ^<input type="text" id="linkName" required placeholder="T.ex. Fortnox"^>
echo         ^</div^>
echo         ^<div class="form-group"^>
echo           ^<label for="linkUrl"^>URL *^</label^>
echo           ^<input type="url" id="linkUrl" required placeholder="https://..."^>
echo         ^</div^>
echo         ^<div class="form-group"^>
echo           ^<label for="linkImage"^>Bild-URL^</label^>
echo           ^<input type="text" id="linkImage" placeholder="https://... eller data:image/...  (valfritt)"^>
echo           ^<small class="form-hint"^>Lämna tomt för att visa benämningen som text^</small^>
echo         ^</div^>
echo         ^<div class="modal-actions"^>
echo           ^<button type="button" class="btn btn-secondary" id="cancelBtn"^>Avbryt^</button^>
echo           ^<button type="button" class="btn btn-danger" id="deleteBtn" style="display: none;"^>Radera^</button^>
echo           ^<button type="submit" class="btn btn-success"^>Spara^</button^>
echo         ^</div^>
echo       ^</form^>
echo     ^</div^>
echo   ^</div^>
echo.
echo   ^<script type="module" src="%FOLDER%.js"^>^</script^>
echo   ^<script src="../scripts/loadNavbar.js"^>^</script^>
echo.
echo   ^<!-- PWA Service Worker Registration --^>
echo   ^<script^>
echo     if ('serviceWorker' in navigator^) {
echo       window.addEventListener('load', function (^) {
echo         navigator.serviceWorker.register('../sw.js'^)
echo           .then(function (registration^) {
echo             console.log('[PWA] Service Worker registered:', registration.scope^);
echo.
echo             // Check for updates
echo             registration.addEventListener('updatefound', (^) =^> {
echo               const newWorker = registration.installing;
echo               console.log('[PWA] New Service Worker found'^);
echo.
echo               newWorker.addEventListener('statechange', (^) =^> {
echo                 if (newWorker.state === 'installed' ^&^& navigator.serviceWorker.controller^) {
echo                   console.log('[PWA] Update available'^);
echo                   if (confirm('En ny version är tillgänglig! Vill du uppdatera nu?'^)^) {
echo                     newWorker.postMessage({ type: 'SKIP_WAITING' }^);
echo                     window.location.reload(^);
echo                   }
echo                 }
echo               }^);
echo             }^);
echo           }^)
echo           .catch(function (err^) {
echo             console.error('[PWA] Service Worker registration failed:', err^);
echo           }^);
echo.
echo         // Reload page when new service worker takes control
echo         let refreshing = false;
echo         navigator.serviceWorker.addEventListener('controllerchange', (^) =^> {
echo           if (^!refreshing^) {
echo             refreshing = true;
echo             console.log('[PWA] New Service Worker activated, reloading...'^);
echo             window.location.reload(^);
echo           }
echo         }^);
echo       }^);
echo     }
echo   ^</script^>
echo ^</body^>
echo.
echo ^</html^>
) > "%FOLDER%\%FOLDER%.html"
echo [OK] Skapade: %FOLDER%/%FOLDER%.html

echo.
echo ========================================
echo   Klart!
echo ========================================
echo.
echo Din nya Link-App sida är skapad i: %FOLDER%/
echo.
echo Nästa steg:
echo   1. Öppna %FOLDER%/%FOLDER%.html i webbläsaren
echo   2. (Valfritt) Lägg till sidan i navbar/navbar.html
echo.
pause
