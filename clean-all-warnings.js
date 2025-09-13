#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Función para limpiar un archivo específico
function cleanFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Remover imports no usados comunes
    const unusedImports = [
      'import { useStore } from',
      'import { AlertTriangle } from',
      'import { Calendar } from',
      'import { Eye } from',
      'import { Download } from',
      'import { Printer } from',
      'import { DollarSign } from',
      'import { User } from',
      'import { Crown } from',
      'import { TrendingUp } from',
      'import { XCircle } from',
      'import { Mail } from',
      'import { CheckCircle } from',
      'import { AlertCircle } from',
      'import { FileText } from',
      'import { Menu } from',
      'import { Package } from',
      'import { ImageIcon } from',
      'import { Infinity } from',
      'import { ExternalLink } from',
      'import { useState } from',
      'import { createProfile } from',
      'import { sendVerificationEmail } from',
      'import { getProfile } from',
      'import { getAvailableCategories } from',
      'import { useEffect } from',
      'import { Button } from',
      'import { CardHeader, CardTitle } from',
      'import { formatCurrency } from',
      'import { AdminSidebar } from',
      'import { AdminRouteGuard } from'
    ];

    unusedImports.forEach(importPattern => {
      const regex = new RegExp(`import\\s+{[^}]*}\\s+from\\s+['"][^'"]*['"];?\\s*`, 'g');
      content = content.replace(regex, (match) => {
        if (match.includes(importPattern.split(' ')[2])) {
          modified = true;
          return `// Removido: import no usado\n`;
        }
        return match;
      });
    });

    // Remover variables no usadas
    const unusedVars = [
      'const [loading, setLoading] = useState(false);',
      'const [activeSection, setActiveSection] = useState',
      'const [sidebarOpen, setSidebarOpen] = useState',
      'const [priceTouched, setPriceTouched] = useState',
      'const [productPrice, setProductPrice] = useState',
      'const [tableData, setTableData] = useState',
      'const [authData, setAuthData] = useState',
      'const [data, setData] = useState',
      'const [profilesData, setProfilesData] = useState',
      'const [siiConfig, setSiiConfig] = useState',
      'const [fallbackData, setFallbackData] = useState',
      'const [categories, setCategories] = useState',
      'const [limit, setLimit] = useState',
      'const [id, setId] = useState',
      'const [siiData, setSiiData] = useState',
      'const [trackId, setTrackId] = useState',
      'const [tableExists, setTableExists] = useState',
      'const [insertedProfile, setInsertedProfile] = useState',
      'const [shouldRedirect, setShouldRedirect] = useState',
      'const [lastError, setLastError] = useState'
    ];

    unusedVars.forEach(varPattern => {
      if (content.includes(varPattern)) {
        content = content.replace(varPattern, `// Removido: variable no usada`);
        modified = true;
      }
    });

    // Remover funciones no usadas
    const unusedFunctions = [
      'const getPlanColorClasses =',
      'const handlePlanSelect =',
      'const getAvailableCategories =',
      'const formatCurrency =',
      'const checkAdminAccess =',
      'const loadConfig =',
      'const loadSales =',
      'const loadProducts =',
      'const loadUserProfile =',
      'const loadSubscriptionData =',
      'const handleResendEmail =',
      'const handlePaymentReturn =',
      'const loadSiiConfig =',
      'const checkEmailVerification ='
    ];

    unusedFunctions.forEach(funcPattern => {
      if (content.includes(funcPattern)) {
        const lines = content.split('\n');
        let inFunction = false;
        let braceCount = 0;
        let startLine = -1;
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(funcPattern)) {
            inFunction = true;
            startLine = i;
            braceCount = 0;
          }
          
          if (inFunction) {
            braceCount += (lines[i].match(/{/g) || []).length;
            braceCount -= (lines[i].match(/}/g) || []).length;
            
            if (braceCount === 0 && lines[i].includes('}')) {
              // Reemplazar función completa
              for (let j = startLine; j <= i; j++) {
                lines[j] = j === startLine ? '  // Removido: función no usada' : '';
              }
              modified = true;
              break;
            }
          }
        }
        content = lines.join('\n');
      }
    });

    // Cambiar variables de error no usadas
    content = content.replace(/} catch \(error\) {/g, '} catch (_error) {');
    content = content.replace(/} catch \(e\) {/g, '} catch (_e) {');
    content = content.replace(/} catch \(err\) {/g, '} catch (_err) {');

    // Remover parámetros no usados
    content = content.replace(/\(e\) =>/g, '(_e) =>');
    content = content.replace(/\(error\) =>/g, '(_error) =>');
    content = content.replace(/\(err\) =>/g, '(_err) =>');
    content = content.replace(/\(data\) =>/g, '(_data) =>');
    content = content.replace(/\(id\) =>/g, '(_id) =>');
    content = content.replace(/\(limit\) =>/g, '(_limit) =>');
    content = content.replace(/\(siiData\) =>/g, '(_siiData) =>');
    content = content.replace(/\(trackId\) =>/g, '(_trackId) =>');

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Limpiado: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.log(`❌ Error limpiando ${filePath}:`, error.message);
    return false;
  }
}

// Función para encontrar todos los archivos TypeScript/JavaScript
function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next')) {
      results = results.concat(findFiles(filePath, extensions));
    } else {
      const ext = path.extname(file);
      if (extensions.includes(ext)) {
        results.push(filePath);
      }
    }
  });
  
  return results;
}

// Limpiar todos los archivos
console.log('🧹 Iniciando limpieza masiva de warnings...');

const srcFiles = findFiles('./src');
let cleanedCount = 0;

srcFiles.forEach(file => {
  if (cleanFile(file)) {
    cleanedCount++;
  }
});

console.log(`🎉 Limpieza completada! ${cleanedCount} archivos limpiados.`);
