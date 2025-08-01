#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Handle specific remaining import patterns
const specificFixes = [
  // Files that might still reference ./types in components/dashboard (should be deleted files)
  {
    file: 'components/dashboard/ChatContainer.tsx',
    fixes: [
      {
        from: /import \{ Message, AuthState, Agent, Organization \} from ['"]\.\/(types)['"]/g,
        to: "import { Message, AuthState, Agent, Organization } from '@/lib/shared/types'"
      }
    ]
  },
  {
    file: 'components/dashboard/ChatInput.tsx',
    fixes: [
      {
        from: /import \{ AuthState, Message \} from ['"]\.\/(types)['"]/g,
        to: "import { AuthState, Message } from '@/lib/shared/types'"
      }
    ]
  },
  {
    file: 'components/dashboard/BusinessChatView.tsx',
    fixes: [
      {
        from: /import \{ Message, AuthState \} from ['"]\.\/(types)['"]/g,
        to: "import { Message, AuthState } from '@/lib/shared/types'"
      }
    ]
  },
  {
    file: 'components/dashboard/ClientChatContainer.tsx',
    fixes: [
      {
        from: /import \{ Message, Agent, Organization \} from ['"]\.\/(types)['"]/g,
        to: "import { Message, Agent, Organization } from '@/lib/shared/types'"
      }
    ]
  },
  {
    file: 'components/dashboard/ClientChatView.tsx',
    fixes: [
      {
        from: /import \{ Agent, Organization \} from ['"]\.\/(types)['"]/g,
        to: "import { Agent, Organization } from '@/lib/shared/types'"
      }
    ]
  }
];

function fixSpecificFile(fileConfig) {
  if (!fs.existsSync(fileConfig.file)) {
    console.log(`⚠️  File doesn't exist (probably moved): ${fileConfig.file}`);
    return;
  }
  
  let content = fs.readFileSync(fileConfig.file, 'utf8');
  let changed = false;
  
  fileConfig.fixes.forEach(fix => {
    if (content.match(fix.from)) {
      content = content.replace(fix.from, fix.to);
      changed = true;
    }
  });
  
  if (changed) {
    fs.writeFileSync(fileConfig.file, content);
    console.log(`✅ Fixed specific imports in: ${fileConfig.file}`);
  }
}

console.log('🎯 Fixing specific remaining imports...');
specificFixes.forEach(fixSpecificFile);
console.log('✅ Specific import fixes complete!');