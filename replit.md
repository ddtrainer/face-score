# Face Score

3초 셀피 스캔 기반 얼굴 인상 분석 & 코칭 앱

## Architecture
- **Frontend**: React + TypeScript + Tailwind CSS + Wouter routing
- **Backend**: Express.js (minimal, serves frontend)
- **Storage**: localStorage for score records (no server DB needed)
- **Analysis Engine**: `client/src/services/faceScoreEngine.ts` — 3-function pipeline (extractFaceSignals → calculateImpressionScores → generateCoaching)

## Key Files
- `client/src/lib/types.ts` - TypeScript interfaces (FaceRecord, AnalysisResult) — 4 traits + mission field
- `client/src/services/faceScoreEngine.ts` - Full analysis engine: 8 internal signals → 4 impression scores (weighted 60/30/10) → summary + 3 tips + daily mission
- `client/src/lib/analysis.ts` - Thin wrapper calling `runFaceScoreEngine()` from services
- `client/src/lib/faceDetection.ts` - Face detection (FaceDetector API + heuristic fallback)
- `client/src/lib/faceStorage.ts` - localStorage CRUD helpers
- `client/src/lib/appState.tsx` - React Context state (no imageUrl stored — only scores + text)
- `client/src/pages/HomePage.tsx` - Landing page with "3초 셀피 스캔 시작" CTA
- `client/src/pages/ScanPage.tsx` - Live camera scan: countdown → 3s frame capture → analysis
- `client/src/pages/ResultPage.tsx` - Score display + 4 traits + 총평 + tips + 내일의 미션
- `client/src/pages/HistoryPage.tsx` - Score history + 7-day chart + 안정감 trait
- `client/src/pages/SettingsPage.tsx` - App info + privacy + premium placeholder
- `client/src/components/` - Reusable UI (Header, BottomNavigation, ScoreCircle, TraitBar, LoadingOverlay)

## Face Score Engine (services/faceScoreEngine.ts)
3-function architecture with AI integration points:
1. **extractFaceSignals(frames)** → 8 internal signals: mouthSoftness, eyeTension, browTension, gazeStability, headStability, expressionConsistency, naturalSmileIndex, captureQuality
2. **calculateImpressionScores(signals)** → 4 user-facing traits + weighted total: expressionExpert 60% + nonverbalPsychology 30% + neuroscience 10%
3. **generateCoaching(scores, signals)** → summary (Korean, encouraging) + 3 tips + 1 daily mission

## Face Detection
- Primary: Browser `FaceDetector` API (Chromium browsers)
- Fallback: Multi-layer heuristic — skin pixel ratio (≥12%), color dominance rejection, centered skin cluster check, dark feature detection
- Both camera scan frames AND file uploads are validated
- Non-face images rejected with Korean toast message

## Scan Flow
1. HomePage → tap "3초 셀피 스캔 시작" → navigate to /scan
2. ScanPage opens camera, shows face guide frame
3. User taps "3초 셀피 스캔 시작" → 3-2-1 countdown
4. 3 seconds of frame capture (6 frames at 500ms intervals)
5. Face detection runs on captured frames — at least 1 frame must contain a face
6. If face found → `analyzeFaceFrames()` → engine result → navigate to /result
7. If no face → toast error, stays on /scan
8. Fallback: file upload button available if camera permission denied

## AI API Integration Points
To connect a real AI API, modify functions in `client/src/services/faceScoreEngine.ts`:
- `extractFaceSignals()` — replace heuristic signal extraction with vision API
- `calculateImpressionScores()` — replace weighted formula with ML model
- `generateCoaching()` — replace template-based text with LLM generation

## Privacy
- No images/videos are stored — only numeric scores and text
- Camera stream is stopped immediately after scanning

## Navigation Pattern
- CRITICAL: Navigation after analysis uses `pendingNavRef` + `useEffect` watching `analysisResult` to avoid React state race conditions. Do NOT call `setLocation` directly after `setAnalysisResult`.

## Design
- Mobile-first responsive
- Purple/blue color scheme (beauty-tech feel)
- Plus Jakarta Sans font
- Card-based UI with framer-motion animations
- TraitBar uses lucide-react icons (no emojis)
- Korean language throughout — coaching tone, non-shaming, encouraging daily return
