import React, { useState, useEffect } from "react";
import {
  TrackerEntry,
  TrackerStage,
  CreateTrackerEntryInput,
  UpdateTrackerEntryInput,
} from "../types/tracker.types";
import { X, Lock, Calendar, Clock, DollarSign, FileText, Link as LinkIcon } from "lucide-react";

interface AddEditTrackerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  entry?: TrackerEntry | null;
  onSave: (data: any) => Promise<void>;
}

export const AddEditTrackerDialog: React.FC<AddEditTrackerDialogProps> = ({
  isOpen,
  onClose,
  entry,
  onSave,
}) => {
  const isEdit = Boolean(entry);
  const isPlatform = entry?.source === "platform";

  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [link, setLink] = useState("");
  const [stage, setStage] = useState<TrackerStage>("saved");
  const [appliedOn, setAppliedOn] = useState("");
  const [followUpAt, setFollowUpAt] = useState("");
  const [interviewAt, setInterviewAt] = useState("");
  const [salaryNote, setSalaryNote] = useState("");
  const [notes, setNotes] = useState("");
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (entry) {
      setJobTitle(entry.jobTitle || "");
      setCompany(entry.company || "");
      setLocation(entry.location || "");
      setLink(entry.link || "");
      setStage(entry.stage || "saved");
      setAppliedOn(entry.appliedOn ? entry.appliedOn.split("T")[0] : "");
      setFollowUpAt(entry.followUpAt ? entry.followUpAt.split("T")[0] : "");
      setInterviewAt(
        entry.interviewAt ? new Date(entry.interviewAt).toISOString().slice(0, 16) : ""
      );
      setSalaryNote(entry.salaryNote || "");
      setNotes(entry.notes || "");
      setRemindersEnabled(entry.remindersEnabled !== false);
    } else {
      setJobTitle("");
      setCompany("");
      setLocation("");
      setLink("");
      setStage("saved");
      setAppliedOn("");
      setFollowUpAt("");
      setInterviewAt("");
      setSalaryNote("");
      setNotes("");
      setRemindersEnabled(true);
    }
    setError(null);
  }, [entry, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      if (!isPlatform) {
        if (!jobTitle.trim() || !company.trim()) {
          setError("Job title and Company name are required.");
          return;
        }
      }

      const payload: any = {
        notes,
        followUpAt: followUpAt ? new Date(followUpAt).toISOString() : null,
        interviewAt: interviewAt ? new Date(interviewAt).toISOString() : null,
        salaryNote,
        remindersEnabled,
      };

      if (!isPlatform) {
        payload.jobTitle = jobTitle.trim();
        payload.company = company.trim();
        payload.location = location.trim();
        payload.link = link.trim();
        payload.stage = stage;
        payload.appliedOn = appliedOn ? new Date(appliedOn).toISOString() : null;
      }

      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to save entry");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative my-8 border border-[#E8D3AA]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-stone-400 hover:text-stone-700"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-stone-900 mb-1 font-serif">
          {isEdit ? (isPlatform ? "Application Notes & Reminders" : "Edit Application") : "Track New Job Application"}
        </h3>
        <p className="text-xs text-stone-500 mb-5">
          {isPlatform
            ? "Synced from your Career OS platform application. Stages are updated automatically by the hiring team."
            : "Keep track of external job applications, recruiter follow-ups, and interview rounds."}
        </p>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isPlatform ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Junior Frontend Dev"
                    className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#064E3B] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Company *
                  </label>
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Google India"
                    className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#064E3B] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Bengaluru / Remote"
                    className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#064E3B] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Current Stage
                  </label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as TrackerStage)}
                    className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-[#064E3B] focus:outline-none"
                  >
                    <option value="saved">Saved / Bookmarked</option>
                    <option value="applied">Applied</option>
                    <option value="screening">Screening / Assignment</option>
                    <option value="interview">Interview</option>
                    <option value="offer">Offer Received</option>
                    <option value="rejected">Rejected / Closed</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Job Link
                  </label>
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://company.com/jobs/..."
                    className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#064E3B] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Date Applied
                  </label>
                  <input
                    type="date"
                    value={appliedOn}
                    onChange={(e) => setAppliedOn(e.target.value)}
                    className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#064E3B] focus:outline-none"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="bg-[#FFF8EC] border border-[#E8D3AA] p-3 rounded-lg text-xs space-y-1">
              <div className="font-semibold text-[#064E3B] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                {entry?.jobTitle} at {entry?.company}
              </div>
              <p className="text-stone-600">
                Current status: <strong>{entry?.stage}</strong> (Managed by recruiter)
              </p>
            </div>
          )}

          {/* Follow-up & Interview Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-100">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Follow-up Date
              </label>
              <input
                type="date"
                value={followUpAt}
                onChange={(e) => setFollowUpAt(e.target.value)}
                className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#064E3B] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                Next Interview Round
              </label>
              <input
                type="datetime-local"
                value={interviewAt}
                onChange={(e) => setInterviewAt(e.target.value)}
                className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#064E3B] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-stone-500" />
              Salary / CTC Note (Private)
            </label>
            <input
              type="text"
              value={salaryNote}
              onChange={(e) => setSalaryNote(e.target.value)}
              placeholder="e.g. ₹5.5 LPA fixed + performance bonus"
              className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#064E3B] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-stone-500" />
              Candidate Notes (Private)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key interviewer names, questions asked, prep thoughts, or contact emails..."
              className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#064E3B] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="reminders"
              checked={remindersEnabled}
              onChange={(e) => setRemindersEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-[#064E3B] focus:ring-[#064E3B]"
            />
            <label htmlFor="reminders" className="text-xs text-stone-600">
              Send daily email reminders for upcoming follow-ups & interviews
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-[#064E3B] hover:bg-[#032E23] rounded-lg shadow-sm disabled:opacity-50"
            >
              {submitting ? "Saving..." : isEdit ? "Update Entry" : "Add to Tracker"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
