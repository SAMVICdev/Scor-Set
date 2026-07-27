@echo off
title SCORE SET - Serveur Local (port 8181)
echo.
echo  Demarrage du serveur SCORE SET sur port 8181...
echo.

cd /d "%~dp0"

python --version >nul 2>&1
if %errorlevel% == 0 (
    python server.py
    goto end
)

python3 --version >nul 2>&1
if %errorlevel% == 0 (
    python3 server.py
    goto end
)

echo  ERREUR : Python n'est pas installe.
echo  Installe Python depuis : https://www.python.org/downloads/
echo  (Coche "Add Python to PATH" pendant l'installation)
echo.
pause

:end
pause
