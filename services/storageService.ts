
import { FullReport } from "../types";

const GLOBAL_STORAGE_KEY = 'talentecho_reports';

// Helper to get key based on user
const getStorageKey = (userId?: string) => {
  return userId ? `talentecho_reports_${userId}` : GLOBAL_STORAGE_KEY;
};

export const saveReport = (report: FullReport, userId?: string) => {
  const key = getStorageKey(userId);
  const existing = getReports(userId);
  const updated = [report, ...existing];
  localStorage.setItem(key, JSON.stringify(updated));
};

export const getReports = (userId?: string): FullReport[] => {
  const key = getStorageKey(userId);
  const stored = localStorage.getItem(key);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};
