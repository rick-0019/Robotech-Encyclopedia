@echo off
title ROBOTECH TACTICAL CODEX - LOCAL SERVER
color 0B

:: Cambiar al directorio del script
cd /d "%~dp0"

echo =======================================================================
echo          ROBOTECH TACTICAL CODEX // U.N. SPACY ARCHIVE
echo =======================================================================
echo.
echo [*] Iniciando servidor local en el puerto 8080...
echo [*] Directorio activo: %CD%
echo.

:: Abrir el navegador automaticamente tras 1 segundo
start "" "http://localhost:8080/"

echo [*] Navegador web iniciado en: http://localhost:8080/
echo [*] Para acceder al gestor CRUD: http://localhost:8080/admin.html
echo.
echo [!] Para detener el servidor, simplemente cierra esta ventana.
echo =======================================================================
echo.

:: Ejecutar servidor web local con soporte de guardado en disco y push a GitHub
if exist server.py (
    python server.py
) else (
    python -m http.server 8080
)

pause
