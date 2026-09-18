import { useState, useEffect, useRef, useCallback } from 'react';
import { formatDateTime } from '../utils/formatters';

export interface UseAutoSaveDraftOptions<T> {
  /** Unique key for storing in localStorage */
  key: string;
  /** Current input form state to be auto-saved */
  data: T;
  /** Whether auto-saving is currently enabled (e.g. when modal is open or form active) */
  enabled?: boolean;
  /** Interval in milliseconds to auto-save to localStorage (default: 3000ms = 3 seconds) */
  intervalMs?: number;
  /** Optional callback triggered when user confirms restoring the draft */
  onRestore?: (restoredData: T) => void;
  /** Optional custom validator or dirty check */
  isDirty?: boolean;
}

export interface SavedDraftPayload<T> {
  data: T;
  savedAt: number; // Unix timestamp
  version?: number;
}

export interface UseAutoSaveDraftReturn<T> {
  /** True if a previously saved draft is available in localStorage */
  hasSavedDraft: boolean;
  /** Timestamp in ms when draft was stored */
  savedTimestamp: number | null;
  /** Human-readable formatted date/time */
  savedTimeFormatted: string | null;
  /** Whether auto-save is actively in progress */
  isSaving: boolean;
  /** Last successful save Date */
  lastSavedAt: Date | null;
  /** Force an immediate save to localStorage */
  saveNow: () => void;
  /** Restore the saved draft */
  restoreDraft: () => T | null;
  /** Clear and delete the draft from localStorage */
  clearDraft: () => void;
  /** Dismiss the draft restoration prompt without clearing the draft */
  dismissDraftNotification: () => void;
}

/**
 * Custom React Hook to automatically persist form input drafts to localStorage
 * every few seconds and restore them upon refresh or accidental navigation.
 */
export function useAutoSaveDraft<T>({
  key,
  data,
  enabled = true,
  intervalMs = 3000,
  onRestore,
  isDirty = true,
}: UseAutoSaveDraftOptions<T>): UseAutoSaveDraftReturn<T> {
  const [hasSavedDraft, setHasSavedDraft] = useState<boolean>(false);
  const [savedTimestamp, setSavedTimestamp] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Keep latest data and options in refs to avoid timer churn
  const dataRef = useRef<T>(data);
  dataRef.current = data;

  const enabledRef = useRef<boolean>(enabled);
  enabledRef.current = enabled;

  const isDirtyRef = useRef<boolean>(isDirty);
  isDirtyRef.current = isDirty;

  // 1. Initial check for existing draft in localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed: SavedDraftPayload<T> = JSON.parse(raw);
        if (parsed && parsed.data && parsed.savedAt) {
          setHasSavedDraft(true);
          setSavedTimestamp(parsed.savedAt);
          setLastSavedAt(new Date(parsed.savedAt));
        }
      }
    } catch {
      // Ignore corrupted json
    }
  }, [key]);

  // 2. Perform save function
  const saveNow = useCallback(() => {
    if (!enabledRef.current || !isDirtyRef.current) return;
    try {
      setIsSaving(true);
      const now = Date.now();
      const payload: SavedDraftPayload<T> = {
        data: dataRef.current,
        savedAt: now,
        version: 1,
      };
      localStorage.setItem(key, JSON.stringify(payload));
      setLastSavedAt(new Date(now));
      setSavedTimestamp(now);
      setHasSavedDraft(true);
    } catch {
      // Fail silently if localStorage quota exceeded
    } finally {
      setTimeout(() => setIsSaving(false), 400);
    }
  }, [key]);

  // 3. Periodic interval auto-save (every few seconds)
  useEffect(() => {
    if (!enabled) return;

    const intervalId = setInterval(() => {
      saveNow();
    }, intervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [enabled, intervalMs, saveNow]);

  // 4. Save immediately on page unload / refresh / accidental navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (enabledRef.current && isDirtyRef.current) {
        try {
          const now = Date.now();
          const payload: SavedDraftPayload<T> = {
            data: dataRef.current,
            savedAt: now,
            version: 1,
          };
          localStorage.setItem(key, JSON.stringify(payload));
        } catch {
          // Ignore
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [key]);

  // 5. Restore saved draft
  const restoreDraft = useCallback((): T | null => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed: SavedDraftPayload<T> = JSON.parse(raw);
      if (parsed && parsed.data) {
        if (onRestore) {
          onRestore(parsed.data);
        }
        return parsed.data;
      }
    } catch {
      // Ignore
    }
    return null;
  }, [key, onRestore]);

  // 6. Clear draft from localStorage
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setHasSavedDraft(false);
      setSavedTimestamp(null);
      setLastSavedAt(null);
    } catch {
      // Ignore
    }
  }, [key]);

  // 7. Dismiss notification without deleting data
  const dismissDraftNotification = useCallback(() => {
    setHasSavedDraft(false);
  }, []);

  const savedTimeFormatted = savedTimestamp
    ? formatDateTime(new Date(savedTimestamp).toISOString())
    : null;

  return {
    hasSavedDraft,
    savedTimestamp,
    savedTimeFormatted,
    isSaving,
    lastSavedAt,
    saveNow,
    restoreDraft,
    clearDraft,
    dismissDraftNotification,
  };
}
