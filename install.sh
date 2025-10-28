#!/bin/bash

echo "🚀 Démarrage de l'application Salon de Beauté"
echo ""

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

echo "📦 Installation des dépendances..."

# Installer les dépendances du backend
echo "Backend..."
cd backend
npm install --quiet
if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de l'installation du backend"
    exit 1
fi

# Installer les dépendances du frontend
echo "Frontend..."
cd ../frontend
npm install --quiet
if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de l'installation du frontend"
    exit 1
fi

cd ..

echo ""
echo "✅ Installation terminée !"
echo ""
echo "📝 Pour démarrer l'application :"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd backend && npm start"
echo ""
echo "Terminal 2 - Frontend:"
echo "  cd frontend && npm run dev"
echo ""
echo "Puis ouvrez: http://localhost:5173"
