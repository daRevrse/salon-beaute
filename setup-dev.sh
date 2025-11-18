#!/bin/bash

echo "========================================"
echo "Configuration SalonHub - Développement Local"
echo "========================================"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "[1/5] Vérification des prérequis..."
echo ""

# Vérifier Node.js
if command -v node &> /dev/null; then
    echo -e "${GREEN}[OK]${NC} Node.js installé :"
    node --version
else
    echo -e "${RED}[ERREUR]${NC} Node.js n'est pas installé !"
    echo "Télécharger sur : https://nodejs.org"
    exit 1
fi

# Vérifier npm
if command -v npm &> /dev/null; then
    echo -e "${GREEN}[OK]${NC} npm installé :"
    npm --version
else
    echo -e "${RED}[ERREUR]${NC} npm n'est pas installé !"
    exit 1
fi

# Vérifier MySQL
if command -v mysql &> /dev/null; then
    echo -e "${GREEN}[OK]${NC} MySQL installé :"
    mysql --version
else
    echo -e "${YELLOW}[ATTENTION]${NC} MySQL n'est pas dans le PATH"
    echo "Assurez-vous que MySQL est installé"
fi

echo ""
echo "[2/5] Configuration Backend..."
cd salonhub-backend

# Vérifier si .env existe
if [ -f .env ]; then
    echo -e "${YELLOW}[ATTENTION]${NC} Un fichier .env existe déjà"
    read -p "Voulez-vous le remplacer par le template local ? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Conservation du fichier .env existant"
    else
        if [ -f .env.local ]; then
            cp .env.local .env.development
            echo -e "${GREEN}[OK]${NC} Fichier .env.development créé depuis .env.local"
            echo -e "${YELLOW}[ACTION REQUISE]${NC} Éditez .env.development et configurez :"
            echo "  - DB_USER"
            echo "  - DB_PASSWORD"
            echo "  - DB_NAME"
        else
            echo -e "${RED}[ERREUR]${NC} Fichier .env.local introuvable !"
        fi
    fi
else
    if [ -f .env.local ]; then
        cp .env.local .env.development
        echo -e "${GREEN}[OK]${NC} Fichier .env.development créé depuis .env.local"
        echo -e "${YELLOW}[ACTION REQUISE]${NC} Éditez .env.development et configurez :"
        echo "  - DB_USER"
        echo "  - DB_PASSWORD"
        echo "  - DB_NAME"
    else
        echo -e "${RED}[ERREUR]${NC} Fichier .env.local introuvable !"
    fi
fi

echo ""
echo "Installation des dépendances Backend..."
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}[OK]${NC} Dépendances Backend installées"
else
    echo -e "${RED}[ERREUR]${NC} Installation des dépendances Backend échouée"
    exit 1
fi

cd ..

echo ""
echo "[3/5] Configuration Frontend..."
cd salonhub-frontend

# Vérifier si .env existe
if [ -f .env ]; then
    echo -e "${YELLOW}[ATTENTION]${NC} Un fichier .env existe déjà"
    read -p "Voulez-vous le remplacer par le template local ? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Conservation du fichier .env existant"
    else
        if [ -f .env.local ]; then
            cp .env.local .env.development
            echo -e "${GREEN}[OK]${NC} Fichier .env.development créé depuis .env.local"
        else
            echo -e "${RED}[ERREUR]${NC} Fichier .env.local introuvable !"
        fi
    fi
else
    if [ -f .env.local ]; then
        cp .env.local .env.development
        echo -e "${GREEN}[OK]${NC} Fichier .env.development créé depuis .env.local"
    else
        echo -e "${RED}[ERREUR]${NC} Fichier .env.local introuvable !"
    fi
fi

echo ""
echo "Installation des dépendances Frontend..."
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}[OK]${NC} Dépendances Frontend installées"
else
    echo -e "${RED}[ERREUR]${NC} Installation des dépendances Frontend échouée"
    exit 1
fi

cd ..

echo ""
echo "[4/5] Configuration de la base de données..."
echo ""
echo "Assurez-vous d'avoir :"
echo "1. MySQL démarré"
echo "2. Créé la base : CREATE DATABASE salonhub;"
echo "3. Importé le schéma : mysql -u root -p salonhub < salonhub-backend/database/schema.sql"
echo ""
read -p "Base de données configurée ? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}[INFO]${NC} Configurez la base de données manuellement"
    echo "Voir : SETUP_LOCAL.md"
fi

echo ""
echo "[5/5] Résumé de la configuration"
echo "========================================"
echo ""
echo "Backend :"
echo "  - Fichier : salonhub-backend/.env.development"
echo "  - Dépendances : OK"
echo "  - Démarrer : cd salonhub-backend && npm start"
echo ""
echo "Frontend :"
echo "  - Fichier : salonhub-frontend/.env.development"
echo "  - Dépendances : OK"
echo "  - Démarrer : cd salonhub-frontend && npm start"
echo ""
echo "Base de données :"
echo "  - Nom : salonhub"
echo "  - Host : localhost"
echo "  - Schéma : salonhub-backend/database/schema.sql"
echo ""
echo "========================================"
echo ""
echo "[ACTION SUIVANTE]"
echo "1. Éditez salonhub-backend/.env.development (DB credentials)"
echo "2. Importez le schéma SQL dans MySQL"
echo "3. Démarrez le backend : cd salonhub-backend && npm start"
echo "4. Démarrez le frontend : cd salonhub-frontend && npm start"
echo ""
echo "Pour plus d'informations : SETUP_LOCAL.md"
echo ""
