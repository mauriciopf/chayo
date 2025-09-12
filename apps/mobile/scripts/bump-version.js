const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getCurrentVersion() {
  try {
    // Read current version from app.config.js
    const appConfigPath = path.join(__dirname, '../app.config.js');
    const appConfig = require(appConfigPath);
    return appConfig.expo.version;
  } catch (error) {
    console.log('Could not read version from app.config.js, using 1.0.0');
    return '1.0.0';
  }
}

function incrementVersion(version, type = 'patch') {
  const [major, minor, patch] = version.split('.').map(Number);
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

function updateAppConfig(newVersion) {
  const appConfigPath = path.join(__dirname, '../app.config.js');
  let content = fs.readFileSync(appConfigPath, 'utf8');
  
  // Update version and runtimeVersion
  content = content.replace(/version: "[^"]*"/, `version: "${newVersion}"`);
  content = content.replace(/runtimeVersion: "[^"]*"/, `runtimeVersion: "${newVersion}"`);
  
  fs.writeFileSync(appConfigPath, content);
  console.log(`✅ Updated app.config.js version to ${newVersion}`);
}

function updateiOSVersion(newVersion) {
  try {
    // Update iOS MARKETING_VERSION using agvtool
    execSync(`cd ios && agvtool new-marketing-version ${newVersion}`, { stdio: 'inherit' });
    console.log(`✅ Updated iOS MARKETING_VERSION to ${newVersion}`);
  } catch (error) {
    console.log('⚠️  agvtool not available, updating project.pbxproj directly');
    
    // Fallback: Update project.pbxproj directly
    const pbxprojPath = path.join(__dirname, '../ios/ChayoMobile.xcodeproj/project.pbxproj');
    let content = fs.readFileSync(pbxprojPath, 'utf8');
    content = content.replace(/MARKETING_VERSION = [^;]*;/g, `MARKETING_VERSION = ${newVersion};`);
    fs.writeFileSync(pbxprojPath, content);
    console.log(`✅ Updated iOS project.pbxproj MARKETING_VERSION to ${newVersion}`);
  }
}

function main() {
  try {
    console.log('🚀 Starting version bump...');
    
    // Get current version
    const currentVersion = getCurrentVersion();
    console.log(`📋 Current version: ${currentVersion}`);
    
    // Determine bump type from environment variable or default to patch
    const bumpType = process.env.VERSION_BUMP_TYPE || 'patch';
    console.log(`📈 Bump type: ${bumpType}`);
    
    // Calculate new version
    const newVersion = incrementVersion(currentVersion, bumpType);
    console.log(`🎯 New version: ${newVersion}`);
    
    // Update app.config.js
    updateAppConfig(newVersion);
    
    // Update iOS native version
    updateiOSVersion(newVersion);
    
    console.log(`✅ Version bump complete! ${currentVersion} → ${newVersion}`);
    
  } catch (error) {
    console.error('❌ Version bump failed:', error.message);
    process.exit(1);
  }
}

main();
