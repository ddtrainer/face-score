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
- `client/src/lib/analysis.ts` - Bridge: ImageData[] → FaceFrameSignal[] → engine → AnalysisResult (throws on empty frames)
- `client/src/lib/faceDetection.ts` - Face validation hard gate with FaceValidationResult, FaceFailureReason enum, structured success/failure
- `client/src/lib/faceStorage.ts` - localStorage CRUD helpers
- `client/src/lib/appState.tsx` - React Context state (no imageUrl stored — only scores + text)
- `client/src/pages/HomePage.tsx` - Landing page with "3초 셀피 스캔 시작" CTA
- `client/src/pages/ScanPage.tsx` - Live camera scan: countdown → 3s frame capture → face validation → analysis
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
1. `aggregateFrameSignals(frames)` — trimmed average with outlier removal + input normalization (throws on empty)
2. `calculateExpressionExpertScore(signals)` — 60% weight area
3. `calculateNonverbalPsychologyScore(signals)` — 30% weight area
4. `calculateNeuroCoachingScore(signals)` — 10% weight area
5. `calculateImpressionScores(signals)` — 4 traits + weighted total
6. `generateSummary(scores, signals)` — Korean coaching summary
7. `generateTips(scores, signals)` — exactly 3 actionable tips with fallback pool
8. `generateMission(scores)` — daily mission based on weakest trait
9. `generateEncouragement(scores)` — motivational message
10. `analyzeFaceFrames(frames)` — main entry point (requires non-empty frames)

### Extension Points
- [확장1] MediaPipe 얼굴 랜드마크 연결 가능
- [확장2] 실제 3초 비디오 프레임 분석 연결 가능
- [확장3] LLM 기반 고급 코칭 생성 추가 가능

## Face Detection Hard Gate (lib/faceDetection.ts)
Structured face validation with success/failure return types.

### Types
- `FaceFailureReason` — 6 failure reasons: NO_FACE, MULTIPLE_FACES, LOW_QUALITY, FACE_TOO_SMALL, FACE_NOT_FRONTAL, FACE_OCCLUDED
- `FaceValidationResult` — `{ success, reason, faceCount }`

### Functions
- `validateFaceInImageData(imageData)` — validates camera frames
- `validateFaceInFile(file)` — validates uploaded files
- `extractImageDataFromFile(file)` — extracts ImageData for analysis
- `getFailureMessage(reason)` — Korean title + description for each failure reason

### Validation Flow
1. Image quality check (brightness, resolution)
2. FaceDetector API (maxDetectedFaces: 5) if available
3. Face count: 0 → NO_FACE, 2+ → MULTIPLE_FACES
4. Face size: < 3% of image → FACE_TOO_SMALL
5. Face centering: face center must be within guide area
6. Heuristic fallback (when FaceDetector API unavailable):
   - Color dominance rejection (green/blue/red dominant → not a face)
   - Skin ratio range (0.18–0.75)
   - Skin centroid centering (distX < 0.30, distY < 0.35)
   - Face region skin ratio ≥ 0.20, non-skin ≥ 0.04
   - Bilateral dark feature detection (eyes) with symmetry ≥ 0.25
   - Mouth region not all-skin (lips/teeth contrast)
   - Forehead skin ≥ 0.08, chin skin ≥ 0.08
   - Edge ratio ≥ 0.03 (structural detail)
   - Final gate: ≥ 5/7 composite checks must pass

### Hard Gate Rules
- NO analysis without validated face
- NO mock/fallback/default scores when face detection fails
- NO navigation to result page on detection failure
- Engine + bridge both throw on empty frames
- createMockFrames() only callable after validation passes

## Scan Flow (ScanPage.tsx)
### Camera path:
1. Countdown → capture 6 frames at 500ms
2. Validate ALL frames (not just one)
3. MULTIPLE_FACES in any frame → immediate failure
4. Majority (>50%) must pass validation
5. On pass → analyzeFaceFrames(frames) → result page
6. On fail → dedicated failure UI with retry buttons

### File upload path:
1. validateFaceInFile(file) — hard gate
2. If fail → failure UI (no result page navigation)
3. If pass → extractImageDataFromFile(file) → analyzeFaceFrames([imageData]) → result page

### Failure UI (phase="failed"):
- Icon: UserX (no face) or Users (multiple faces)
- Korean error title + description from getFailureMessage()
- "다시 촬영하기" button
- "다른 사진 업로드하기" button
- "처음으로 돌아가기" button

## Analysis Bridge (lib/analysis.ts)
- Converts ImageData[] → FaceFrameSignal[] using deterministic pixel analysis
- No randomness in signal extraction (identical images produce identical scores)
- Throws if frames array is empty — prevents analysis without face data
- Calls engine's analyzeFaceFrames() and maps result to AnalysisResult

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
