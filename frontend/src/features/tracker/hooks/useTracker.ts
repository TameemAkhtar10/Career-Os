import { useState, useEffect, useCallback } from "react";
import { trackerApi } from "../services/tracker.api";
import {
  TrackerEntry,
  TrackerCounts,
  TrackerSummaryResponse,
  TrackerStage,
  CreateTrackerEntryInput,
  UpdateTrackerEntryInput,
} from "../types/tracker.types";

interface UseTrackerOptions {
  initialStage?: string;
}

export function useTracker(options: UseTrackerOptions = {}) {
  const [stage, setStage] = useState<string>(options.initialStage || "all");
  const [search, setSearch] = useState<string>("");
  const [entries, setEntries] = useState<TrackerEntry[]>([]);
  const [counts, setCounts] = useState<TrackerCounts>({
    all: 0,
    saved: 0,
    applied: 0,
    screening: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
    withdrawn: 0,
  });
  const [summary, setSummary] = useState<TrackerSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await trackerApi.getEntries({
        stage: stage !== "all" ? stage : undefined,
        search: search.trim() || undefined,
        limit: 100,
      });
      setEntries(res?.entries || []);
      if (res?.counts) {
        setCounts(res.counts);
      }
    } catch (err: any) {
      console.error("Failed to load tracker entries:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, [stage, search]);

  const fetchSummary = useCallback(async () => {
    try {
      const sum = await trackerApi.getSummary();
      setSummary(sum);
    } catch (err) {
      console.error("Failed to load tracker summary:", err);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const createEntry = async (input: CreateTrackerEntryInput) => {
    const newEntry = await trackerApi.createEntry(input);
    await fetchEntries();
    await fetchSummary();
    return newEntry;
  };

  const updateEntry = async (id: string, input: UpdateTrackerEntryInput) => {
    const updated = await trackerApi.updateEntry(id, input);
    setEntries((prev) => prev.map((e) => (e._id === id ? updated : e)));
    await fetchSummary();
    return updated;
  };

  const deleteEntry = async (id: string) => {
    await trackerApi.deleteEntry(id);
    setEntries((prev) => prev.filter((e) => e._id !== id));
    await fetchSummary();
  };

  const updateStage = async (id: string, newStage: TrackerStage) => {
    return updateEntry(id, { stage: newStage });
  };

  const snoozeFollowUp = async (id: string, days = 3) => {
    const newDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    return updateEntry(id, { followUpAt: newDate });
  };

  const clearFollowUp = async (id: string) => {
    return updateEntry(id, { followUpAt: null });
  };

  return {
    entries,
    counts,
    summary,
    loading,
    error,
    stage,
    setStage,
    search,
    setSearch,
    fetchEntries,
    fetchSummary,
    createEntry,
    updateEntry,
    deleteEntry,
    updateStage,
    snoozeFollowUp,
    clearFollowUp,
  };
}
