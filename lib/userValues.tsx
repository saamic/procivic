"use client";

// Procivic — the user's value-vector state (DESIGN.md §4.2, §9).
//
// A React context backed by localStorage. There is NO auth and NO database: the
// user's stances/importance/nuance live entirely in the browser. The stored shape
// is the shared `UserValues` type from lib/types.ts; issue keys are `IssueId`.
//
// SSR-safety: the server render and the very first client render BOTH produce a
// stable empty vector so React hydration never mismatches. localStorage is only
// touched after mount (inside a useEffect, guarded by `typeof window`), at which
// point `ready` flips to true and the real persisted vector takes over.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
  type ReactNode,
} from "react";

import type { IssueId } from "@/config/issues";
import type { UserValues } from "@/lib/types";

/** localStorage key for the persisted value vector. Versioned so we can migrate later. */
const STORAGE_KEY = "procivic.user-values.v1";

/** A nuance refinement payload for a single issue. */
type IssueNuance = { refinements?: Record<string, number>; note?: string };

/**
 * The public shape of the user-values context.
 * Other builders code against this contract — keep names/signatures exact.
 */
export interface UserValuesContextValue {
  /** The current persisted vector: { stances, importance, nuance?, updatedAt }. */
  values: UserValues;
  /** False until localStorage has hydrated on the client (SSR-safe). */
  ready: boolean;
  /** True once the user has answered >=1 issue (any importance>0 or any stance set). */
  hasVector: boolean;
  /** Set the user's stance on an issue. Clamps `value` to [-1, 1]. */
  setStance(issue: IssueId, value: number): void;
  /**
   * Set how much the user cares about an issue, 0..1.
   * Use SCORING.importanceLevels values: none/low/med/high = 0/0.25/0.5/1.
   */
  setImportance(issue: IssueId, value: number): void;
  /** Attach optional nuance (refinements/note) to an issue. */
  setNuance(issue: IssueId, nuance: IssueNuance): void;
  /** Clear the entire vector (and remove it from localStorage). */
  reset(): void;
}

/** A fresh, stable empty vector. Used for SSR/first render and `reset()`. */
function emptyValues(): UserValues {
  return { stances: {}, importance: {}, updatedAt: "" };
}

/** Clamp a number into [min, max]. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** True if the vector represents a user who has answered at least one issue. */
function computeHasVector(values: UserValues): boolean {
  const anyImportance = Object.values(values.importance).some(
    (w) => typeof w === "number" && w > 0,
  );
  const anyStance = Object.values(values.stances).some(
    (s) => typeof s === "number",
  );
  return anyImportance || anyStance;
}

/**
 * Best-effort read of the persisted vector. Returns `null` when there is nothing
 * stored or the stored value is unusable (corrupt JSON, wrong shape, etc.) so we
 * fall back to a clean empty vector rather than throwing during hydration.
 */
function readStored(): UserValues | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<UserValues> | null;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      stances: parsed.stances ?? {},
      importance: parsed.importance ?? {},
      nuance: parsed.nuance,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
    };
  } catch {
    return null;
  }
}

/** Best-effort persist. Swallows quota/availability errors (private mode etc.). */
function writeStored(values: UserValues): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  } catch {
    /* ignore — persistence is best-effort, in-memory state still works */
  }
}

const UserValuesContext = createContext<UserValuesContextValue | null>(null);

/**
 * Provides the user's value vector to the tree. Hydrates from localStorage on
 * mount and persists every mutation. Wrap the app (root layout) in this.
 */
export function UserValuesProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  // Server + first client render: stable empty vector, ready=false (no hydration mismatch).
  const [values, setValues] = useState<UserValues>(emptyValues);
  const [ready, setReady] = useState(false);

  // After mount we may persist; before that, mutations stay in-memory only so we
  // never write a value that the pending hydration would clobber.
  const hydratedRef = useRef(false);

  // Hydrate from localStorage exactly once, on the client, after first paint.
  useEffect(() => {
    const stored = readStored();
    if (stored) setValues(stored);
    hydratedRef.current = true;
    setReady(true);
  }, []);

  /**
   * Apply a pure update to the vector, stamp `updatedAt`, persist, and commit.
   * The timestamp is generated here (in a client event handler), which is safe.
   */
  const commit = useCallback(
    (update: (prev: UserValues) => UserValues): void => {
      setValues((prev) => {
        const next: UserValues = {
          ...update(prev),
          updatedAt: new Date().toISOString(),
        };
        if (hydratedRef.current) writeStored(next);
        return next;
      });
    },
    [],
  );

  const setStance = useCallback(
    (issue: IssueId, value: number): void => {
      commit((prev) => ({
        ...prev,
        stances: { ...prev.stances, [issue]: clamp(value, -1, 1) },
      }));
    },
    [commit],
  );

  const setImportance = useCallback(
    (issue: IssueId, value: number): void => {
      commit((prev) => ({
        ...prev,
        importance: { ...prev.importance, [issue]: clamp(value, 0, 1) },
      }));
    },
    [commit],
  );

  const setNuance = useCallback(
    (issue: IssueId, nuance: IssueNuance): void => {
      commit((prev) => ({
        ...prev,
        nuance: { ...(prev.nuance ?? {}), [issue]: nuance },
      }));
    },
    [commit],
  );

  const reset = useCallback((): void => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
    setValues(emptyValues());
  }, []);

  const hasVector = useMemo(() => computeHasVector(values), [values]);

  const ctx = useMemo<UserValuesContextValue>(
    () => ({
      values,
      ready,
      hasVector,
      setStance,
      setImportance,
      setNuance,
      reset,
    }),
    [values, ready, hasVector, setStance, setImportance, setNuance, reset],
  );

  return (
    <UserValuesContext.Provider value={ctx}>
      {children}
    </UserValuesContext.Provider>
  );
}

/**
 * Access the user's value vector. Must be called inside `<UserValuesProvider>`;
 * throws otherwise so misuse is caught immediately rather than silently no-op-ing.
 */
export function useUserValues(): UserValuesContextValue {
  const ctx = useContext(UserValuesContext);
  if (ctx === null) {
    throw new Error("useUserValues must be used within a <UserValuesProvider>");
  }
  return ctx;
}
