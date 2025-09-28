#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Define comprehensive import fixes
const importFixes = [
  // Fix relative type imports to use shared types
  {
    pattern: /from ['"]\.\/(types)['"]/g,
    replacement: "from '../../../shared/types'"
  },
  {
    pattern: /from ['"]\.\.\/(types)['"]/g,
    replacement: "from '../../shared/types'"
  },
  
  // Fix relative chatContextMessages imports
  {
    pattern: /from ['"]\.\/(chatContextMessages)['"]/g,
    replacement: "from '../services/chatContextMessages'"
  },
  
  // Fix remaining old service imports
  {
    pattern: /from ['"]@\/lib\/services\/embeddingService['"]/g,
    replacement: "from '@/lib/shared/services/embeddingService'"
  },
  {
    pattern: /from ['"]@\/lib\/services\/conversationStorageService['"]/g,
    replacement: "from '@/lib/shared/services/conversationStorageService'"
  },
  {
    pattern: /from ['"]@\/lib\/services\/organizationService['"]/g,
    replacement: "from '@/lib/features/organizations/services/organizationService'"
  },
  {
    pattern: /from ['"]@\/lib\/services\/agentToolConstraints['"]/g,
    replacement: "from '@/lib/features/tools/shared/services/agentToolConstraints'"
  },
  {
    pattern: /from ['"]@\/lib\/services\/toolIntentService['"]/g,
    replacement: "from '@/lib/features/tools/shared/services/toolIntentService'"
  },
  
  // Fix dashboard component type imports
  {
    pattern: /from ['"]@\/components\/dashboard\/types['"]/g,
    replacement: "from '@/lib/shared/types'"
  },
  
  // Fix hook imports
  {
    pattern: /from ['"]@\/lib\/hooks\/useOnboardingCompletion['"]/g,
    replacement: "from '@/lib/features/onboarding/hooks/useOnboardingCompletion'"
  },
  
  // Fix remaining organization-related imports
  {
    pattern: /from ['"]@\/lib\/services\/organization\/UserOrganizationManager['"]/g,
    replacement: "from '@/lib/features/organizations/services/organization/UserOrganizationManager'"
  },
  
  // Fix system prompt imports for organizations
  {
    pattern: /from ['"]\.\/(systemPrompt\/[^'"]+)['"]/g,
    replacement: "from '../../chat/services/$1'"
  },
  {
    pattern: /from ['"]\.\.\/(systemPrompt\/[^'"]+)['"]/g,
    replacement: "from '../chat/services/$1'"
  }
];

function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  importFixes.forEach(fix => {
    if (content.match(fix.pattern)) {
      content = content.replace(fix.pattern, fix.replacement);
      changed = true;
    }
  });
  
  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed imports in: ${filePath}`);
  }
}

function walkDirectory(dir) {
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && 
        !item.includes('node_modules') && 
        !item.includes('.git') && 
        !item.includes('.next')) {
      walkDirectory(fullPath);
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      fixImportsInFile(fullPath);
    }
  });
}

console.log('🔧 Starting comprehensive import fixes...');
walkDirectory('.');
console.log('✅ Import fixing complete!');