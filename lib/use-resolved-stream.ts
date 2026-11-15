"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { resolveStream, StreamResolveError, type ResolvedStream } from "./stream";

export type ResolveStatus = "idle" | "resolving" | "ready" | "error";

/**
 * Resolve a fresh stream URL for one episode (resolvable rows only).
 * Enabled=false leaves the state idle. Re-runs when drama/episode change;
 * in-flight resolves are invalidated so a stale response never wins.
 */
export function useResolvedStream(dramaId: string, episode: number, enabled: boolean) {
  const [status, setStatus] = useState<ResolveStatus>("idle");
  const [stream, setStream] = useState<ResolvedStream | null>(null);
  const [error, setError] = useState<StreamResolveError | null>(null);
  const runRef = useRef(0);

  const run = useCallback(async () => {
    const runId = ++runRef.current;
    setStatus("resolving");
    setError(null);
    try {
      const s = await resolveStream(dramaId, episode);
      if (runRef.current !== runId) return;
      setStream(s);
      setStatus("ready");
    } catch (e) {
      if (runRef.current !== runId) return;
      setError(
        e instanceof StreamResolveError
          ? e
          : new StreamResolveError("upstream_unavailable", true)
      );
      setStatus("error");
    }
  }, [dramaId, episode]);

  useEffect(() => {
    if (!enabled) {
      runRef.current++;
      setStatus("idle");
      setStream(null);
      setError(null);
      return;
    }
    setStream(null);
    run();
    return () => {
      runRef.current++;
    };
  }, [enabled, run]);

  const retry = useCallback(() => {
    run();
  }, [run]);

  return { status, stream, error, retry };
}
