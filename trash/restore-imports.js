#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Mapeo de componentes comunes que se usan
const componentUsage = {
  'Edit': /Edit\s*className/,
  'CheckCircle': /CheckCircle\s*className/,
  'XCircle': /XCircle\s*className/,
  'Check': /Check\s*className/,
  'X': /X\s*className/,
  'DollarSign': /DollarSign\s*className/,
  'Globe': /Globe\s*className/,
  'MapPin': /MapPin\s*className/,
  'Calendar': /Calendar\s*className/,
  'Bug': /Bug\s*className/,
  'Trash2': /Trash2\s*className/,
  'EyeOff': /EyeOff\s*className/,
};

function addMissingImports(content, filePath) {
  const neededImports = [];
  
  // Verificar qué imports necesitamos
  Object.entries(componentUsage).forEach(([componentName, pattern]) => {
    if (pattern.test(content)) {
      neededImports.push(componentName);
    }
  });
  
  if (neededImports.length === 0) {
    return content;
  }
  
  // Buscar la línea de import de lucide-react
  const importRegex = /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]lucide-react['"];/;
  const match = content.match(importRegex);
  
  if (match) {
    const currentImports = match[1].split(',').map(i => i.trim());
    const allImports = [...new Set([...currentImports, ...neededImports])].sort();
    const newImportLine = `import { ${allImports.join(', ')} } from 'lucide-react';`;
    
    return content.replace(importRegex, newImportLine);
  }
  
  return content;
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const modified = addMissingImports(content, filePath);
    
    if (modified !== content) {
      fs.writeFileSync(filePath, modified);
      console.log(`✅ Restaurado: ${path.relative(process.cwd(), filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message);
    return false;
  }
}

function getAllFiles(dir, extensions) {
  let files = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files = files.concat(getAllFiles(fullPath, extensions));
      } else if (extensions.some(ext => fullPath.endsWith(ext))) {
        files.push(fullPath);
      }
    });
  } catch (error) {
    // Directorio no existe o no accesible
  }
  
  return files;
}

function main() {
  const targetDirs = [
    'src/app',
    'src/components'
  ];
  
  let totalFiles = 0;
  let modifiedFiles = 0;
  
  targetDirs.forEach(dir => {
    const fullDir = path.join(process.cwd(), dir);
    if (fs.existsSync(fullDir)) {
      const files = getAllFiles(fullDir, ['.tsx', '.ts']);
      files.forEach(file => {
        totalFiles++;
        if (processFile(file)) {
          modifiedFiles++;
        }
      });
    }
  });
  
  console.log(`\n📊 Resumen:`);
  console.log(`   Archivos procesados: ${totalFiles}`);
  console.log(`   Archivos modificados: ${modifiedFiles}`);
}

if (require.main === module) {
  main();
}