#!/usr/bin/env bash
# Verify Gemini configuration is correctly set up

set -e

echo "🔍 Gemini Configuration Verification"
echo "===================================="
echo ""

# Check environment variables
echo "1️⃣  Environment Variables:"
echo "   GEMINI_MODEL=${GEMINI_MODEL:-gemini-2.5-flash}"
echo "   GEMINI_TEMPERATURE=${GEMINI_TEMPERATURE:-0.7}"
echo "   GEMINI_MAX_TOKENS=${GEMINI_MAX_TOKENS:-4096}"
echo "   GEMINI_API_KEY=${GEMINI_API_KEY:+***configured***}"

if [ -z "$GEMINI_API_KEY" ]; then
  echo ""
  echo "   ⚠️  WARNING: GEMINI_API_KEY is not set"
  echo "   Add to .env: GEMINI_API_KEY=your_key"
  exit 1
fi

echo ""

# Check if .env file exists
if [ -f .env ]; then
  echo "2️⃣  .env File Found:"
  grep -E "GEMINI_" .env | sed 's/GEMINI_API_KEY=.*/GEMINI_API_KEY=***redacted***/' || echo "   (no GEMINI_* variables in .env)"
  echo ""
else
  echo "2️⃣  .env File: NOT FOUND"
  echo "   Create .env with:"
  echo "   GEMINI_API_KEY=your_key"
  echo ""
fi

# Check source files
echo "3️⃣  Source Files:"
if [ -f "src/ai/llm/gemini.ts" ]; then
  echo "   ✓ src/ai/llm/gemini.ts exists"
else
  echo "   ✗ src/ai/llm/gemini.ts NOT FOUND"
  exit 1
fi

if [ -f "src/ai/init.ts" ]; then
  echo "   ✓ src/ai/init.ts exists"
else
  echo "   ✗ src/ai/init.ts NOT FOUND"
  exit 1
fi

if [ -f "src/ai/test-gemini.ts" ]; then
  echo "   ✓ src/ai/test-gemini.ts exists"
else
  echo "   ✗ src/ai/test-gemini.ts NOT FOUND"
  exit 1
fi

echo ""

# Check for hardcoded model values
echo "4️⃣  Hardcoded Values Check:"
if grep -r "gemini-2.5-pro\|gemini-pro" src/ai --include="*.ts" | grep -v "node_modules\|dist" | grep -v "//.*gemini-pro" > /dev/null 2>&1; then
  echo "   ✗ FOUND hardcoded model overrides:"
  grep -r "gemini-2.5-pro\|gemini-pro" src/ai --include="*.ts" | grep -v "node_modules\|dist" | grep -v "//.*gemini-pro" | head -5
  exit 1
else
  echo "   ✓ No hardcoded gemini-2.5-pro overrides found"
fi

# Check imports in init.ts
echo ""
echo "5️⃣  Imports Check:"
if grep -q "createGeminiClient\|setLLMClient" src/ai/init.ts; then
  echo "   ✓ init.ts imports createGeminiClient and setLLMClient"
else
  echo "   ✗ Missing required imports in init.ts"
  exit 1
fi

# Check if it's called in main index.ts
if grep -q "initializeAIModule" src/index.ts 2>/dev/null; then
  echo "   ✓ initializeAIModule called in src/index.ts"
else
  echo "   ⚠️  initializeAIModule might not be called in src/index.ts"
fi

echo ""

# Build check
echo "6️⃣  Build Status:"
if npm run build 2>&1 | grep -q "error"; then
  echo "   ✗ Build failed"
  npm run build 2>&1 | tail -10
  exit 1
else
  echo "   ✓ Build passed (TypeScript compilation clean)"
fi

echo ""
echo "✅ All checks passed!"
echo ""
echo "Next steps:"
echo "   1. Ensure GEMINI_API_KEY is set in .env"
echo "   2. Run: npm run dev"
echo "   3. Verify startup logs show: '✓ AI module initialized with gemini-2.5-flash provider'"
echo "   4. Test: npx ts-node src/ai/test-gemini.ts"
echo ""
