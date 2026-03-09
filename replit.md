# Face Score

3초 셀피 스캔 기반 얼굴 인상 분석 & 코칭 앱

## Architecture
- **Frontend**: React + TypeScript + Tailwind CSS + Wouter routing
- **Backend**: Express.js (minimal, serves frontend)
- **Storage**: localStorage for score records (no server DB needed)
- **Analysis Engine**: `client/src/services/faceScoreEngine.ts` — 10-function pipeline

## Key Files
- `client/src/lib/types.ts` - TypeScript interfaces (FaceRecord, AnalysisResult) — 4 traits + mission + encouragement + qualityMessage
- `client/src/services/faceScoreEngine.ts` - Full analysis engine: FaceFrameSignal → aggregate → expert scores (60/30/10) → coaching
- `client/src/lib/analysis.ts` - Bridge: ImageData[] → FaceFrameSignal[] → engine → AnalysisResult
- `client/src/lib/faceDetection.ts` - Face detection (FaceDetector API + heuristic fallback)
- `client/src/lib/faceStorage.ts` - localStorage CRUD helpers
- `client/src/lib/appState.tsx` - React Context state (no imageUrl stored — only scores + text)
- `client/src/pages/HomePage.tsx` - Landing page with "3초 셀피 스캔 시작" CTA
- `client/src/pages/ScanPage.tsx` - Live camera scan: countdown → 3s frame capture → analysis
- `client/src/pages/ResultPage.tsx` - Score display + 4 traits + 총평 + tips + 미션 + 동기부여 + 품질메시지
- `client/src/pages/HistoryPage.tsx` - Score history + 7-day chart
- `client/src/pages/SettingsPage.tsx` - App info + privacy + premium placeholder
- `client/src/components/` - Reusable UI (Header, BottomNavigation, ScoreCircle, TraitBar, LoadingOverlay)

## Face Score Engine (services/faceScoreEngine.ts)
10-function architecture with Korean comments and AI extension points:

### Types
- `FaceFrameSignal` — 8 signals per frame (0~1 range): mouthSoftness, eyeTension, browTension, gazeStability, headStability, expressionConsistency, naturalSmileIndex, captureQuality
- `AggregatedFaceSignals` — averaged signals across frames
- `ImpressionScores` — 4 user-facing traits + totalScore (0~100)
- `CoachingResult` — summary + tips[3] + mission + encouragement
- `FaceScoreAnalysisResult` — signals + scores + coaching + qualityMessage

### Functions
1. `aggregateFrameSignals(frames)` — trimmed average with outlier removal + input normalization
2. `calculateExpressionExpertScore(signals)` — 60% weight area
3. `calculateNonverbalPsychologyScore(signals)` — 30% weight area
4. `calculateNeuroCoachingScore(signals)` — 10% weight area
5. `calculateImpressionScores(signals)` — 4 traits + weighted total
6. `generateSummary(scores, signals)` — Korean coaching summary
7. `generateTips(scores, signals)` — exactly 3 actionable tips with fallback pool
8. `generateMission(scores)` — daily mission based on weakest trait
9. `generateEncouragement(scores)` — motivational message
10. `analyzeFaceFrames(frames)` — main entry point

### Mock Data
- `createMockFrames("good" | "neutral" | "tense")` — generates 6 test frames

### Extension Points
- [확장1] MediaPipe 얼굴 랜드마크 연결 가능
- [확장2] 실제 3초 비디오 프레임 분석 연결 가능
- [확장3] LLM 기반 고급 코칭 생성 추가 가능

## Analysis Bridge (lib/analysis.ts)
- Converts ImageData[] → FaceFrameSignal[] using deterministic pixel analysis
- No randomness in signal extraction (identical images produce identical scores)
- Calls engine's analyzeFaceFrames() and maps result to AnalysisResult

## Face Detection
- Primary: Browser `FaceDetector` API (Chromium browsers)
- Fallback: Multi-layer heuristic — skin pixel ratio, color dominance rejection, centered cluster check, dark feature detection
- Both camera scan frames AND file uploads are validated

## Scan Flow
1. HomePage → tap "3초 셀피 스캔 시작" → navigate to /scan
2. ScanPage opens camera, shows face guide frame
3. User taps "3초 셀피 스캔 시작" → 3-2-1 countdown
4. 3 seconds of frame capture (6 frames at 500ms intervals)
5. Face detection runs on captured frames — at least 1 frame must contain a face
6. If face found → analyzeFaceFrames() → engine result → navigate to /result
7. If no face → toast error, stays on /scan
8. Fallback: file upload button available if camera permission denied

## Privacy
- No images/videos are stored — only numeric scores and text
- Camera stream is stopped immediately after scanning

## Navigation Pattern
- CRITICAL: Navigation after analysis uses `pendingNavRef` + `useEffect` watching `analysisResult`. Do NOT call `setLocation` directly after `setAnalysisResult`.

## Design
- Mobile-first responsive
- Purple/blue color scheme (beauty-tech feel)
- Plus Jakarta Sans font
- Card-based UI with framer-motion animations
- TraitBar uses lucide-react icons (no emojis)
- Korean language throughout — coaching tone, non-shaming, encouraging daily return
