# SCRIPT DI RIORGANIZZAZIONE MYAPP2026 - PowerShell
Write-Host "Iniziando riorganizzazione MyApp2026..." -ForegroundColor Green

# 1. Crea nuove cartelle
Write-Host "Creando nuova struttura cartelle..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "assets\css" | Out-Null
New-Item -ItemType Directory -Force -Path "assets\js" | Out-Null
New-Item -ItemType Directory -Force -Path "assets\images" | Out-Null
New-Item -ItemType Directory -Force -Path "icons" | Out-Null
New-Item -ItemType Directory -Force -Path "docs" | Out-Null
New-Item -ItemType Directory -Force -Path "lib" | Out-Null

# 2. Sposta file dalla cartella public/ alla root (se esistono)
Write-Host "Spostando file pubblici..." -ForegroundColor Yellow
if (Test-Path "public") {
    Get-ChildItem "public\*.html" -ErrorAction SilentlyContinue | Move-Item -Destination "." -Force
    
    if (Test-Path "public\css") {
        Get-ChildItem "public\css\*" -ErrorAction SilentlyContinue | Move-Item -Destination "assets\css" -Force
    }
    if (Test-Path "public\js") {
        Get-ChildItem "public\js\*" -ErrorAction SilentlyContinue | Move-Item -Destination "assets\js" -Force
    }
    if (Test-Path "public\images") {
        Get-ChildItem "public\images\*" -ErrorAction SilentlyContinue | Move-Item -Destination "assets\images" -Force
    }
}

# 3. Organizza CSS
Write-Host "Organizzando CSS..." -ForegroundColor Yellow
Get-ChildItem "*.css" -ErrorAction SilentlyContinue | Where-Object {$_.DirectoryName -notlike "*assets*"} | Move-Item -Destination "assets\css" -Force

# 4. Organizza JS (esclusi alcuni file)
Write-Host "Organizzando JavaScript..." -ForegroundColor Yellow
Get-ChildItem "*.js" -ErrorAction SilentlyContinue | Where-Object {
    $_.Name -ne "service-worker.js" -and 
    $_.DirectoryName -notlike "*lib*" -and 
    $_.DirectoryName -notlike "*assets*" -and
    $_.DirectoryName -notlike "*node_modules*"
} | Move-Item -Destination "assets\js" -Force

# 5. Sposta da cartelle vecchie
if (Test-Path "js") {
    Write-Host "Spostando da js ad assets\js..." -ForegroundColor Yellow
    Get-ChildItem "js\*" -ErrorAction SilentlyContinue | Move-Item -Destination "assets\js" -Force
    Remove-Item "js" -Force -ErrorAction SilentlyContinue
}

if (Test-Path "styles") {
    Write-Host "Spostando da styles ad assets\css..." -ForegroundColor Yellow
    Get-ChildItem "styles\*" -ErrorAction SilentlyContinue | Move-Item -Destination "assets\css" -Force
    Remove-Item "styles" -Force -ErrorAction SilentlyContinue
}

# 6. Organizza immagini
Write-Host "Organizzando immagini..." -ForegroundColor Yellow
Get-ChildItem -Include "*.png","*.jpg","*.jpeg","*.gif","*.svg","*.ico" -ErrorAction SilentlyContinue | Where-Object {
    $_.DirectoryName -notlike "*assets*" -and 
    $_.DirectoryName -notlike "*icons*" -and
    $_.DirectoryName -notlike "*node_modules*"
} | Move-Item -Destination "assets\images" -Force

Write-Host "Riorganizzazione completata!" -ForegroundColor Green
Write-Host "Controlla le nuove cartelle create" -ForegroundColor Cyan

# Mostra la struttura finale
Write-Host "`nStruttura finale:" -ForegroundColor Magenta
Get-ChildItem -Directory | Format-Table Name