#!/bin/bash
# Zaapi Build-Check Helper Script
# Runs production bundler to check for compilation issues.

echo "==============================="
echo "⚙️ Running Production Build Check..."
echo "==============================="

npm run build
build_status=$?

if [ $build_status -eq 0 ]; then
  echo "✅ Build compiled successfully with zero errors."
  exit 0
else
  echo "❌ Build failed. Please review compiler logs."
  exit $build_status
fi
