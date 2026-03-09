# Face Score

AI-powered facial impression analyzer that scores your face and provides coaching tips.

## Architecture
- **Frontend**: React + TypeScript + Tailwind CSS + Wouter routing
- **Backend**: Express.js (minimal, serves frontend)
- **Storage**: localStorage for score records (no server DB needed)
- **Analysis**: Mock AI analysis with scoring logic (ready for real API integration)

## Key Files
- `client/src/lib/types.ts` - TypeScript interfaces (FaceRecord, AnalysisResult)
- `client/src/lib/analysis.ts` - Mock AI analysis functions (replace with real API here)
- `client/src/lib/faceStorage.ts` - localStorage CRUD helpers
- `client/src/pages/HomePage.tsx` - Photo upload + camera capture
- `client/src/pages/ResultPage.tsx` - Score display + traits + tips
- `client/src/pages/HistoryPage.tsx` - Score history + chart
- `client/src/pages/SettingsPage.tsx` - App info + privacy + premium placeholder
- `client/src/components/` - Reusable UI components (Header, BottomNavigation, ScoreCircle, TraitBar, etc.)

## Face Detection
- `client/src/lib/faceDetection.ts` - Validates uploaded images contain a human face before analysis
- Uses browser FaceDetector API (Chrome/Edge) with skin-tone heuristic fallback
- Non-face images (flowers, objects, etc.) are rejected with a Korean toast message
- Replace with a real face detection API for production use

## AI API Integration Point
To connect a real AI API, edit `client/src/lib/analysis.ts`:
- Replace `analyzeFaceMock()` with actual API call
- The function receives image data and returns `AnalysisResult`

## Design
- Mobile-first responsive
- Purple/blue color scheme (beauty-tech feel)
- Plus Jakarta Sans font
- Card-based UI with framer-motion animations
