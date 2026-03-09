import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { AnalysisResult, FaceRecord } from "./types";
import { getRecords, saveRecord as storageSaveRecord, generateId, getLatestRecord, getAverageScore } from "./faceStorage";

interface AppState {
  analysisResult: AnalysisResult | null;
  imageUrl: string | null;
  isAnalyzing: boolean;
  records: FaceRecord[];
  latestRecord: FaceRecord | null;
  averageScore: number | null;
  setAnalysisResult: (result: AnalysisResult, imageUrl: string) => void;
  clearAnalysisResult: () => void;
  setIsAnalyzing: (v: boolean) => void;
  saveCurrentResult: () => boolean;
  refreshRecords: () => void;
}

const AppStateContext = createContext<AppState | null>(null);

const SESSION_RESULT_KEY = "face_score_session_result";
const SESSION_IMAGE_KEY = "face_score_session_image";

function loadSessionResult(): AnalysisResult | null {
  try {
    const data = sessionStorage.getItem(SESSION_RESULT_KEY);
    return data ? (JSON.parse(data) as AnalysisResult) : null;
  } catch {
    return null;
  }
}

function loadSessionImage(): string | null {
  return sessionStorage.getItem(SESSION_IMAGE_KEY);
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [analysisResult, setAnalysisResultState] = useState<AnalysisResult | null>(loadSessionResult);
  const [imageUrl, setImageUrl] = useState<string | null>(loadSessionImage);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [records, setRecords] = useState<FaceRecord[]>(getRecords);
  const [latestRecord, setLatestRecord] = useState<FaceRecord | null>(getLatestRecord);
  const [averageScore, setAverageScore] = useState<number | null>(getAverageScore);
  const [hasSaved, setHasSaved] = useState(false);

  const refreshRecords = useCallback(() => {
    setRecords(getRecords());
    setLatestRecord(getLatestRecord());
    setAverageScore(getAverageScore());
  }, []);

  const setAnalysisResult = useCallback((result: AnalysisResult, url: string) => {
    setAnalysisResultState(result);
    setImageUrl(url);
    setHasSaved(false);
    try {
      sessionStorage.setItem(SESSION_RESULT_KEY, JSON.stringify(result));
      sessionStorage.setItem(SESSION_IMAGE_KEY, url);
    } catch { /* ignore */ }
  }, []);

  const clearAnalysisResult = useCallback(() => {
    if (imageUrl && imageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imageUrl);
    }
    setAnalysisResultState(null);
    setImageUrl(null);
    setHasSaved(false);
    sessionStorage.removeItem(SESSION_RESULT_KEY);
    sessionStorage.removeItem(SESSION_IMAGE_KEY);
  }, [imageUrl]);

  const saveCurrentResult = useCallback((): boolean => {
    if (!analysisResult) return false;
    if (hasSaved) return false;

    storageSaveRecord({
      id: generateId(),
      date: new Date().toISOString(),
      totalScore: analysisResult.totalScore,
      friendliness: analysisResult.friendliness,
      vitality: analysisResult.vitality,
      confidence: analysisResult.confidence,
      summary: analysisResult.summary,
      tips: analysisResult.tips,
    });

    setHasSaved(true);
    refreshRecords();
    return true;
  }, [analysisResult, hasSaved, refreshRecords]);

  useEffect(() => {
    return () => {
      if (imageUrl && imageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  return (
    <AppStateContext.Provider
      value={{
        analysisResult,
        imageUrl,
        isAnalyzing,
        records,
        latestRecord,
        averageScore,
        setAnalysisResult,
        clearAnalysisResult,
        setIsAnalyzing,
        saveCurrentResult,
        refreshRecords,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
