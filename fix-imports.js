#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Common import replacements
const replacements = [
  {
    from: "@/lib/supabase/client",
    to: "@/lib/shared/supabase/client"
  },
  {
    from: "@/lib/supabase/server", 
    to: "@/lib/shared/supabase/server"
  },
  {
    from: "@/components/dashboard/types",
    to: "@/lib/shared/types"
  },
  {
    from: "@/lib/utils",
    to: "@/lib/shared/utils"
  },
  {
    from: "./DesktopNavigation",
    to: "../navigation/DesktopNavigation"
  }
];

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  replacements.forEach(replacement => {
    const regex = new RegExp(replacement.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    if (content.includes(replacement.from)) {
      content = content.replace(regex, replacement.to);
      changed = true;
    }
  });
  
  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed imports in: ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git') && !file.includes('.next')) {
      walkDir(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fixFile(filePath);
    }
  });
}

// Start from current directory
walkDir('.');
console.log('Import fixing complete!');