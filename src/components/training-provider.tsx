"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Assessment, Snapshot } from "@/lib/domain";
import { dataMode } from "@/lib/config";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Action =
  | { action: "profile"; input: Assessment }
  | { action: "task"; taskId: string; completed: boolean }
  | { action: "checkin" };
type TrainingContext = {
  state: Snapshot | null;
  loading: boolean;
  busy: boolean;
  error: string | null;
  needsLogin: boolean;
  reload: () => Promise<void>;
  mutate: (action: Action) => Promise<boolean>;
};
const Context = createContext<TrainingContext | null>(null);
export function TrainingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Snapshot | null>(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null),
    [needsLogin, setNeedsLogin] = useState(false);
  const reading = useRef<AbortController | null>(null);
  const writing = useRef(false);
  const sequence = useRef(0);
  const invalidateRead = useCallback(() => {
    reading.current?.abort();
    reading.current = null;
    sequence.current++;
  }, []);
  const apply = useCallback((snapshot: Snapshot | null) => {
    setNeedsLogin(!snapshot);
    setState(snapshot);
  }, []);
  const request = useCallback(async (action?: Action, signal?: AbortSignal) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (dataMode === "supabase") {
      const { data } = await supabaseBrowser().auth.getSession();
      if (!data.session) {
        return null;
      }
      headers.Authorization = `Bearer ${data.session.access_token}`;
    }
    const response = await fetch("/api/training", {
      method: action ? "POST" : "GET",
      headers,
      body: action ? JSON.stringify(action) : undefined,
      cache: "no-store",
      signal,
    });
    const result = await response.json();
    if (response.status === 401) {
      return null;
    }
    if (!response.ok) throw new Error(result.error || "连接失败，请重试。");
    return result as Snapshot;
  }, []);
  const reload = useCallback(async () => {
    if (writing.current || reading.current) return;
    const controller = new AbortController();
    reading.current = controller;
    const version = ++sequence.current;
    try {
      const result = await request(undefined, controller.signal);
      if (version === sequence.current && !controller.signal.aborted) {
        apply(result);
        setError(null);
      }
    } catch (e) {
      if (version === sequence.current && !controller.signal.aborted)
        setError(e instanceof Error ? e.message : "加载失败，请重试。");
    } finally {
      if (reading.current === controller) reading.current = null;
      if (version === sequence.current) setLoading(false);
    }
  }, [request, apply]);
  useEffect(() => {
    const initialLoad = window.setTimeout(() => void reload(), 0);
    const focus = () => {
      if (document.visibilityState === "visible") void reload();
    };
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", focus);
    const interval = window.setInterval(focus, 60000);
    return () => {
      window.clearTimeout(initialLoad);
      invalidateRead();
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", focus);
      window.clearInterval(interval);
    };
  }, [reload, invalidateRead]);
  const mutate = async (action: Action) => {
    if (writing.current) return false;
    writing.current = true;
    // A background refresh must never consume a user action or overwrite its response.
    invalidateRead();
    const version = ++sequence.current;
    setBusy(true);
    setError(null);
    try {
      const result = await request(action);
      if (version !== sequence.current) return false;
      apply(result);
      return Boolean(result);
    } catch (e) {
      if (version === sequence.current)
        setError(e instanceof Error ? e.message : "保存失败，请重试。");
      return false;
    } finally {
      writing.current = false;
      if (version === sequence.current) {
        setBusy(false);
        setLoading(false);
      }
    }
  };
  return (
    <Context.Provider value={{ state, loading, busy, error, needsLogin, reload, mutate }}>
      {children}
    </Context.Provider>
  );
}
export function useTraining() {
  const context = useContext(Context);
  if (!context) throw new Error("Missing TrainingProvider");
  return context;
}
