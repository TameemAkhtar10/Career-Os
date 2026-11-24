"use client";

import React, { useState } from "react";
import { useTracker } from "@/features/tracker/hooks/useTracker";
import { TrackerSummaryStrip } from "@/features/tracker/components/TrackerSummaryStrip";
import { TrackerBoardView } from "@/features/tracker/components/TrackerBoardView";
import { TrackerListView } from "@/features/tracker/components/TrackerListView";
import { AddEditTrackerDialog } from "@/features/tracker/components/AddEditTrackerDialog";
import { TrackerEntry } from "@/features/tracker/types/tracker.types";
import { Plus, LayoutGrid, List, Search, RefreshCw, Briefcase } from "lucide-react";

export default function CandidateTrackerPage() {
  const {
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
    createEntry,
    updateEntry,
    deleteEntry,
    updateStage,
    snoozeFollowUp,
    clearFollowUp,
  } = useTracker();

  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TrackerEntry | null>(null);

  const handleEdit = (entry: TrackerEntry) => {
    setEditingEntry(entry);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingEntry(null);
    setDialogOpen(true);
  };

  const handleSave = async (data: any) => {
    if (editingEntry) {
      await updateEntry(editingEntry._id, data);
    } else {
      await createEntry(data);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif">
              Application Tracker
            </h1>
            <p className="text-sm text-stone-600 mt-1">
              Organize your job hunt across Career OS and external applications with zero clutter.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#064E3B] hover:bg-[#032E23] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Track Job</span>
            </button>
          </div>
        </div>

        {/* Top Summary Strip */}
        <TrackerSummaryStrip summary={summary} />

        {/* Controls Toolbar */}
        <div className="bg-white border border-[#E8D3AA] rounded-xl p-3 mb-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search by role or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs sm:text-sm pl-9 pr-3 py-1.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            {/* View Mode Toggle */}
            <div className="flex items-center border border-stone-200 rounded-lg p-0.5 bg-stone-50">
              <button
                onClick={() => setViewMode("board")}
                className={`p-1.5 rounded text-xs flex items-center gap-1 font-medium transition-colors ${
                  viewMode === "board"
                    ? "bg-white text-[#064E3B] shadow-xs"
                    : "text-stone-500 hover:text-stone-800"
                }`}
                title="Board View"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Board</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded text-xs flex items-center gap-1 font-medium transition-colors ${
                  viewMode === "list"
                    ? "bg-white text-[#064E3B] shadow-xs"
                    : "text-stone-500 hover:text-stone-800"
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>

            <button
              onClick={() => fetchEntries()}
              className="p-1.5 border border-stone-200 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-50"
              title="Refresh tracker"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 mb-6 rounded-xl bg-rose-50 text-rose-700 text-sm border border-rose-200">
            {error}
          </div>
        )}

        {/* Views */}
        {loading && entries.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-stone-400">
            <RefreshCw className="w-6 h-6 animate-spin text-[#064E3B] mb-2" />
            <p className="text-sm">Loading applications...</p>
          </div>
        ) : viewMode === "board" ? (
          <TrackerBoardView
            entries={entries}
            onEdit={handleEdit}
            onDelete={deleteEntry}
            onSnooze={snoozeFollowUp}
            onMarkDone={clearFollowUp}
          />
        ) : (
          <TrackerListView
            entries={entries}
            onEdit={handleEdit}
            onDelete={deleteEntry}
            onUpdateStage={updateStage}
          />
        )}

        {/* Add / Edit Dialog */}
        <AddEditTrackerDialog
          isOpen={dialogOpen}
          onClose={() => setDialogOpen(false)}
          entry={editingEntry}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
