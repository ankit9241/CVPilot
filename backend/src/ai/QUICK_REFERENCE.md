# Gemini Configuration — Quick Reference

## TL;DR

```bash
# 1. Set these in .env (or deploy system):
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TEMPERATURE=0.7
GEMINI_MAX_TOKENS=4096
GEMINI_API_KEY=your_key

# 2. Run the app
npm run dev

# 3. See this at startup:
# 📊 AI Module Configuration:
#    Model: gemini-2.5-flash
#    Temperature: 0.7
#    Max Tokens: 4096
#    API Key: ***configured***
# ✓ AI module initialized with gemini-2.5-flash provider

# 4. Test it:
npx ts-node src/ai/test-gemini.ts
```

---

## Environment Variables

| Name | Default | Options |
|------|---------|---------|
| `GEMINI_MODEL` | `gemini-2.5-flash` | `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-pro` |
| `GEMINI_TEMPERATURE` | `0.7` | `0.0` (deterministic) - `1.0` (creative) |
| `GEMINI_MAX_TOKENS` | `4096` | Adjust based on response length needs |
| `GEMINI_API_KEY` | **Required** | Get from https://aistudio.google.com/apikey |

---

## Change Model (Development)

```bash
# Via .env
GEMINI_MODEL=gemini-2.0-flash npm run dev

# Or in test
GEMINI_MODEL=gemini-pro npx ts-node src/ai/test-gemini.ts
```

---

## Change Model (Production)

```yaml
# Kubernetes
env:
  - name: GEMINI_MODEL
    value: gemini-2.5-flash

# Docker
ENV GEMINI_MODEL=gemini-2.5-flash

# GitHub Actions / CI/CD
env:
  GEMINI_MODEL: gemini-2.5-flash
```

---

## Verify Configuration

```bash
# Check what's set
echo "Model: ${GEMINI_MODEL:-gemini-2.5-flash}"
echo "Temperature: ${GEMINI_TEMPERATURE:-0.7}"
echo "Max Tokens: ${GEMINI_MAX_TOKENS:-4096}"
echo "API Key: ${GEMINI_API_KEY:+***configured***}"

# Run test (includes Step 0 verification)
npx ts-node src/ai/test-gemini.ts
```

---

## Files to Know

| File | Purpose |
|------|---------|
| `src/ai/init.ts` | Startup: reads env vars, logs config |
| `src/ai/llm/gemini.ts` | Gemini provider (reads env vars) |
| `src/ai/test-gemini.ts` | Test script (verifies config Step 0) |
| `src/ai/MODEL_CONFIGURATION.md` | Complete configuration audit |
| `src/ai/GEMINI_SETUP.md` | Setup guide with examples |
| `src/ai/PHASE_3_SUMMARY.md` | Completion report |

---

## Common Issues

**Q: "GEMINI_API_KEY environment variable is not set"**
- A: Add `GEMINI_API_KEY=...` to `.env` and restart

**Q: "WARNING: Not using gemini-2.5-flash"**
- A: Set `GEMINI_MODEL=gemini-2.5-flash` in `.env`

**Q: Where do I change the model?**
- A: Just set `GEMINI_MODEL=model_name` in `.env` — no code changes needed

**Q: Can I use a different model temporarily?**
- A: Yes: `GEMINI_MODEL=gemini-pro npx ts-node src/ai/test-gemini.ts`

---

## Architecture

```
.env (environment variables)
  ↓
src/index.ts (initializeAIModule)
  ↓
src/ai/init.ts (logs config, creates client)
  ↓
src/ai/llm/gemini.ts (reads env, calls Gemini API)
  ↓
LangGraph Workflow (9 nodes)
  ↓
Google Gemini API
```

**Single source of truth:** `process.env.GEMINI_MODEL`

---

## Deployment Checklist

- [ ] Set `GEMINI_API_KEY` (required)
- [ ] Set `GEMINI_MODEL=gemini-2.5-flash` (optional, has default)
- [ ] Verify no hardcoded model values in deployment
- [ ] Start app and confirm startup log shows correct model
- [ ] Run test: `npx ts-node src/ai/test-gemini.ts`
- [ ] Test should show Step 0 verification with ✓ or ⚠️

---

## References

- **Setup Guide:** `src/ai/GEMINI_SETUP.md`
- **Configuration Audit:** `src/ai/MODEL_CONFIGURATION.md`
- **Phase 3 Report:** `src/ai/PHASE_3_SUMMARY.md`
- **Google AI Studio:** https://aistudio.google.com/
- **Gemini API Docs:** https://ai.google.dev/

---

**Production Ready** ✅ | **Build Passing** ✅ | **Verified** ✅
