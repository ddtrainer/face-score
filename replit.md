# Face Score

3초 셀피 스캔 기반 얼굴 인상 분석 & 코칭 앱

## Architecture
- **Frontend**: React + TypeScript + Tailwind CSS + Wouter routing
- **Backend**: Express.js (minimal, serves frontend)
- **Storage**: localStorage for score records (no server DB needed)
- **Analysis**: Mock AI analysis with scoring logic (ready for real API integration)

## Key Files
- `client/src/lib/types.ts` - TypeScript interfaces (FaceRecord, AnalysisResult) — includes 4 traits: friendliness, vitality, confidence, stability
- `client/src/lib/analysis.ts` - Mock analysis engine (`analyzeFaceFrames()`) — replace with real AI API here
- `client/src/lib/faceStorage.ts` - localStorage CRUD helpers
- `client/src/lib/appState.tsx` - React Context state (no imageUrl stored — only scores)
- `client/src/pages/HomePage.tsx` - Landing page with "3초 셀피 스캔 시작" CTA
- `client/src/pages/ScanPage.tsx` - Live camera scan: countdown → 3s frame capture → analysis
- `client/src/pages/ResultPage.tsx` - Score display + 4 traits + 총평 + tips
- `client/src/pages/HistoryPage.tsx` - Score history + 7-day chart + 안정감 trait
- `client/src/pages/SettingsPage.tsx` - App info + privacy + premium placeholder
- `client/src/components/` - Reusable UI (Header, BottomNavigation, ScoreCircle, TraitBar, LoadingOverlay)

## Scan Flow
1. HomePage → tap "3초 셀피 스캔 시작" → navigate to /scan
2. ScanPage opens camera, shows face guide frame
3. User taps "3초 셀피 스캔 시작" → 3-2-1 countdown
4. 3 seconds of frame capture (6 frames at 500ms intervals)
5. Frames passed to `analyzeFaceFrames()` → mock result
6. Navigation to /result via `useEffect` watching `analysisResult`
7. Fallback: file upload button available if camera permission denied

## AI API Integration Point
To connect a real AI API, edit `client/src/lib/analysis.ts`:
- Replace `analyzeFaceFrames(frames)` with actual API call
- Input: array of `ImageData` frames captured from camera
- Output: `AnalysisResult` (friendliness, vitality, confidence, stability, totalScore, summary, tips)

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
- Korean language throughout
