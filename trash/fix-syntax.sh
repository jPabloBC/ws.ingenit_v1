#!/bin/bash

# Script para arreglar la sintaxis de los archivos con SecurityGuard mal estructurado

files=(
  "src/app/quick-sales/page.tsx"
  "src/app/sales/page.tsx"
  "src/app/subscription/page.tsx"
)

for file in "${files[@]}"; do
  echo "Arreglando $file..."
  
  # Arreglar la estructura del return principal
  sed -i '' 's/  return (/  return (\n    <SecurityGuard>/g' "$file"
  
  # Arreglar el cierre
  sed -i '' 's/    <\/SecurityGuard>$/    <\/SecurityGuard>\n  );/g' "$file"
  
  # Arreglar el patrón específico de cierre mal formateado
  sed -i '' 's/      <\/Layout>/      <\/Layout>/g' "$file"
  sed -i '' 's/    <\/SecurityGuard>$/    <\/SecurityGuard>\n  );/g' "$file"
  
  echo "✅ $file arreglado"
done

echo "🎉 Todos los archivos arreglados!"
