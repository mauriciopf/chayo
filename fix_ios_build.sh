#!/bin/bash

# Fix iOS build issues - Clean up corrupted files and caches

echo "🧹 Cleaning iOS build environment..."

cd apps/mobile

# 1. Clean all caches and generated files
echo "📦 Cleaning node_modules and caches..."
rm -rf node_modules
rm -rf ios/build
rm -rf ios/Pods
rm -rf ios/Podfile.lock
rm -rf ~/.cocoapods/repos/trunk
rm -rf ~/Library/Caches/CocoaPods
rm -rf ~/Library/Developer/Xcode/DerivedData

# 2. Clean any hidden or problematic files
echo "🗑️  Removing hidden and temp files..."
find . -name ".DS_Store" -delete
find . -name "*.tmp" -delete
find . -name "*~" -delete
find . -name "._*" -delete

# 3. Clean React Native caches
echo "⚛️  Cleaning React Native caches..."
npx react-native clean-project-auto

# 4. Reinstall dependencies
echo "📥 Reinstalling dependencies..."
pnpm install

# 5. Clean and reinstall pods
echo "🍎 Cleaning and reinstalling iOS pods..."
cd ios
pod cache clean --all
pod deintegrate
pod setup
pod install --repo-update --clean-install
cd ..

echo "✅ iOS build environment cleaned!"
echo "🚀 Try running the EAS build again"
