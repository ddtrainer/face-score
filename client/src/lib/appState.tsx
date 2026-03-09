import { createContext, useContext, useState, useCallback } from "react";
import type { AnalysisResult, FaceRecord } from "./types";
import { getRecords, saveRecord as storageSaveRecord, generateId, getLatestRecord, getAverageScore } from "./faceStorage";

interface AppState {
  analysisResult: AnalysisResult | null;
  isAnalyzing: boolean;
  records: FaceRecord[];
  latestRecord: FaceRecord | null;
  averageScore: number | null;
  setAnalysisResult: (result: AnalysisResult) => void;
  clearAnalysisResult: () => void;
  setIsAnalyzing: (v: boolean) => void;
  saveCurrentResult: () => boolean;
  refreshRecords: () => void;
}

const AppStateContext = createContext<AppState | null>(null);

const SESSION_RESULT_KEY = "face_score_session_result";

function loadSessionResult(): AnalysisResult | null {
  try {
    const data = sessionStorage.getItem(SESSION_RESULT_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data) as AnalysisResult;
    if (typeof parsed.stability !== "number") {
      parsed.stability = Math.round((parsed.friendliness + parsed.vitality + parsed.confidence) / 3);
      parsed.totalScore = Math.round((parsed.friendliness + parsed.vitality + parsed.confidence + parsed.stability) / 4);
    }
    if (typeof parsed.mission !== "string") {
      parsed.mission = "내일도 거울 앞에서 가벼운 미소를 연습해 보세요!";
    }
    if (typeof parsed.encouragement !== "string") {
      parsed.encouragement = "매일 조금씩 변화하고 있어요. 내일도 함께해요!";
    }
    if (typeof parsed.qualityMessage !== "string") {
      parsed.qualityMessage = "분석 품질이 안정적입니다.";
    }
    return parsed;
  } catch {
    return null;
  }
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [analysisResult, setAnalysisResultState] = useState<AnalysisResult | null>(loadSessionResult);
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

  const setAnalysisResult = useCallback((result: AnalysisResult) => {
    setAnalysisResultState(result);
    setHasSaved(false);
    try {
      sessionStorage.setItem(SESSION_RESULT_KEY, JSON.stringify(result));
    } catch { /* ignore */ }
  }, []);

  const clearAnalysisResult = useCallback(() => {
    setAnalysisResultState(null);
    setHasSaved(false);
    sessionStorage.removeItem(SESSION_RESULT_KEY);
  }, []);

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
      stability: analysisResult.stability,
      summary: analysisResult.summary,
      tips: analysisResult.tips,
      mission: analysisResult.mission,
      encouragement: analysisResult.encouragement,
      qualityMessage: analysisResult.qualityMessage,
    });

    setHasSaved(true);
    refreshRecords();
    return true;
  }, [analysisResult, hasSaved, refreshRecords]);

  return (
    <AppStateContext.Provider
      value={{
        analysisResult,
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
