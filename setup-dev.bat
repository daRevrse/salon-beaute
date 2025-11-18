@echo off
echo ========================================
echo Configuration SalonHub - Developpement Local
echo ========================================
echo.

echo [1/5] Verification des prerequis...
echo.

REM Verifier Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js n'est pas installe !
    echo Telecharger sur : https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js installe :
node --version

REM Verifier MySQL
mysql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ATTENTION] MySQL n'est pas dans le PATH
    echo Assurez-vous que MySQL est installe
) else (
    echo [OK] MySQL installe :
    mysql --version
)

echo.
echo [2/5] Configuration Backend...
cd salonhub-backend

REM Verifier si .env existe
if exist .env (
    echo [ATTENTION] Un fichier .env existe deja
    choice /C YN /M "Voulez-vous le remplacer par le template local"
    if errorlevel 2 goto skip_backend_env
    if errorlevel 1 goto copy_backend_env
) else (
    goto copy_backend_env
)

:copy_backend_env
if exist .env.local (
    copy .env.local .env.development
    echo [OK] Fichier .env.development cree depuis .env.local
    echo [ACTION REQUISE] Editez .env.development et configurez :
    echo   - DB_USER
    echo   - DB_PASSWORD
    echo   - DB_NAME
) else (
    echo [ERREUR] Fichier .env.local introuvable !
)

:skip_backend_env
echo.
echo Installation des dependances Backend...
call npm install
if %errorlevel% neq 0 (
    echo [ERREUR] Installation des dependances Backend echouee
    pause
    exit /b 1
)
echo [OK] Dependances Backend installees

cd ..

echo.
echo [3/5] Configuration Frontend...
cd salonhub-frontend

REM Verifier si .env existe
if exist .env (
    echo [ATTENTION] Un fichier .env existe deja
    choice /C YN /M "Voulez-vous le remplacer par le template local"
    if errorlevel 2 goto skip_frontend_env
    if errorlevel 1 goto copy_frontend_env
) else (
    goto copy_frontend_env
)

:copy_frontend_env
if exist .env.local (
    copy .env.local .env.development
    echo [OK] Fichier .env.development cree depuis .env.local
) else (
    echo [ERREUR] Fichier .env.local introuvable !
)

:skip_frontend_env
echo.
echo Installation des dependances Frontend...
call npm install
if %errorlevel% neq 0 (
    echo [ERREUR] Installation des dependances Frontend echouee
    pause
    exit /b 1
)
echo [OK] Dependances Frontend installees

cd ..

echo.
echo [4/5] Configuration de la base de donnees...
echo.
echo Assurez-vous d'avoir :
echo 1. MySQL demarre
echo 2. Cree la base : CREATE DATABASE salonhub;
echo 3. Importe le schema : mysql -u root -p salonhub ^< salonhub-backend/database/schema.sql
echo.
choice /C YN /M "Base de donnees configuree"
if errorlevel 2 (
    echo [INFO] Configurez la base de donnees manuellement
    echo Voir : SETUP_LOCAL.md
)

echo.
echo [5/5] Resume de la configuration
echo ========================================
echo.
echo Backend :
echo   - Fichier : salonhub-backend\.env.development
echo   - Dependances : OK
echo   - Demarrer : cd salonhub-backend ^&^& npm start
echo.
echo Frontend :
echo   - Fichier : salonhub-frontend\.env.development
echo   - Dependances : OK
echo   - Demarrer : cd salonhub-frontend ^&^& npm start
echo.
echo Base de donnees :
echo   - Nom : salonhub
echo   - Host : localhost
echo   - Schema : salonhub-backend/database/schema.sql
echo.
echo ========================================
echo.
echo [ACTION SUIVANTE]
echo 1. Editez salonhub-backend\.env.development (DB credentials)
echo 2. Importez le schema SQL dans MySQL
echo 3. Demarrez le backend : cd salonhub-backend ^&^& npm start
echo 4. Demarrez le frontend : cd salonhub-frontend ^&^& npm start
echo.
echo Pour plus d'informations : SETUP_LOCAL.md
echo.
pause
