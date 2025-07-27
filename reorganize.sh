#!/bin/bash

# SCRIPT DI RIORGANIZZAZIONE MYAPP2026
echo "🚀 Iniziando riorganizzazione MyApp2026..."

# 1. Crea nuove cartelle
echo "📁 Creando nuova struttura cartelle..."
mkdir -p assets/css
mkdir -p assets/js  
mkdir -p assets/images
mkdir -p icons
mkdir -p docs
mkdir -p lib

# 2. Sposta file dalla cartella public/ alla root (se esistono)
echo "📦 Spostando file pubblici..."
if [ -d "public" ]; then
    find public -name "*.html" -exec mv {} . \; 2>/dev/null
    
    if [ -d "public/css" ]; then
        mv public/css/* assets/css/ 2>/dev/null
    fi
    if [ -d "public/js" ]; then
        mv public/js/* assets/js/ 2>/dev/null
    fi
    if [ -d "public/images" ]; then
        mv public/images/* assets/images/ 2>/dev/null
    fi
fi

# 3. Organizza CSS
echo "🎨 Organizzando CSS..."
find . -maxdepth 2 -name "*.css" -not -path "./assets/*" -exec mv {} assets/css/ \; 2>/dev/null

# 4. Organizza JS
echo "⚡ Organizzando JavaScript..."
find . -maxdepth 2 -name "*.js" -not -path "./lib/*" -not -path "./node_modules/*" -not -path "./assets/*" -not -name "service-worker.js" -exec mv {} assets/js/ \; 2>/dev/null

# 5. Sposta da cartelle vecchie
if [ -d "js" ] && [ "$(ls -A js 2>/dev/null)" ]; then
    echo "📂 Spostando da js/ ad assets/js/..."
    mv js/* assets/js/ 2>/dev/null
    rmdir js 2>/dev/null
fi

if [ -d "styles" ] && [ "$(ls -A styles 2>/dev/null)" ]; then
    echo "🎨 Spostando da styles/ ad assets/css/..."
    mv styles/* assets/css/ 2>/dev/null
    rmdir styles 2>/dev/null
fi

# 6. Organizza immagini
echo "🖼️ Organizzando immagini..."
find . -maxdepth 2 \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" -o -name "*.svg" -o -name "*.ico" \) -not -path "./assets/*" -not -path "./icons/*" -not -path "./node_modules/*" -exec mv {} assets/images/ \; 2>/dev/null

echo "✅ Riorganizzazione completata!"