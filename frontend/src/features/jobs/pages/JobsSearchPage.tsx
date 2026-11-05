"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePublicJobs } from "../hooks/useJobs";
import { JobCard } from "../components/JobCard";
import { Job, JobsQueryParams, JobsResponseData } from "../../../types/job";
import { JobType, WorkMode } from "../../../constants/enums";
import { Skeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/feedback/EmptyState";
import { Pagination } from "../../../components/ui/Pagination";
import { Search, MapPin, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { Button } from "../../../components/ui/Button";

export interface JobsSearchPageProps {
  initialData?: JobsResponseData;
}

export const JobsSearchPage: React.FC<JobsSearchPageProps> = ({ initialData }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state
  const qParam = searchParams.get("q") || "";
  const cityParam = searchParams.get("city") || "";
  const workModeParam = (searchParams.get("workMode") as WorkMode) || undefined;
  const jobTypeParam = (searchParams.get("jobType") as JobType) || undefined;
  const skillsParam = searchParams.get("skills") || "";
  const fresherParam = searchParams.get("fresher") === "true";
  const minSalaryParam = searchParams.get("minSalary")
    ? Number(searchParams.get("minSalary"))
    : undefined;
  const sortParam = (searchParams.get("sort") as "latest" | "salary") || "latest";
  const pageParam = Number(searchParams.get("page")) || 1;

  // Local filter states
  const [searchTerm, setSearchTerm] = useState(qParam);
  const [cityInput, setCityInput] = useState(cityParam);
  const [workMode, setWorkMode] = useState<WorkMode | undefined>(workModeParam);
  const [jobType, setJobType] = useState<JobType | undefined>(jobTypeParam);
  const [skills, setSkills] = useState<string[]>(
    skillsParam ? skillsParam.split(",").map((s) => s.trim()).filter(Boolean) : []
  );
  const [fresherOnly, setFresherOnly] = useState(fresherParam);
  const [minLpa, setMinLpa] = useState<number>(
    minSalaryParam ? Math.round(minSalaryParam / 100000) : 0
  );
  const [sort, setSort] = useState<"latest" | "salary">(sortParam);
  const [page, setPage] = useState<number>(pageParam);

  // Sync state to URL
  const updateUrl = useCallback(
    (params: Partial<JobsQueryParams>) => {
      const sp = new URLSearchParams();
      if (params.q) sp.set("q", params.q);
      if (params.city) sp.set("city", params.city);
      if (params.workMode) sp.set("workMode", params.workMode);
      if (params.jobType) sp.set("jobType", params.jobType);
      if (params.skills) sp.set("skills", params.skills);
      if (params.fresher) sp.set("fresher", "true");
      if (params.minSalary) sp.set("minSalary", String(params.minSalary));
      if (params.sort && params.sort !== "latest") sp.set("sort", params.sort);
      if (params.page && params.page > 1) sp.set("page", String(params.page));

      router.replace(`/jobs?${sp.toString()}`, { scroll: false });
    },
    [router]
  );

  // Debounced search trigger (400ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      updateUrl({
        q: searchTerm.trim() || undefined,
        city: cityInput.trim() || undefined,
        workMode,
        jobType,
        skills: skills.length > 0 ? skills.join(",") : undefined,
        fresher: fresherOnly,
        minSalary: minLpa > 0 ? minLpa * 100000 : undefined,
        sort,
        page: 1,
      });
    }, 400);

    return () => clearTimeout(handler);
  }, [searchTerm, cityInput, workMode, jobType, skills, fresherOnly, minLpa, sort, updateUrl]);

  // Query parameters for TanStack Query
  const queryParams: JobsQueryParams = {
    q: qParam || undefined,
    city: cityParam || undefined,
    workMode: workModeParam,
    jobType: jobTypeParam,
    skills: skillsParam || undefined,
    fresher: fresherParam || undefined,
    minSalary: minSalaryParam,
    sort: sortParam,
    page: pageParam,
    limit: 12,
  };

  const { data, isLoading, isPlaceholderData } = usePublicJobs(queryParams, initialData);

  const jobs = data?.jobs || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const handleClearFilters = () => {
    setSearchTerm("");
    setCityInput("");
    setWorkMode(undefined);
    setJobType(undefined);
    setSkills([]);
    setFresherOnly(false);
    setMinLpa(0);
    setSort("latest");
    setPage(1);
    router.replace("/jobs", { scroll: false });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateUrl({
      q: searchTerm || undefined,
      city: cityInput || undefined,
      workMode,
      jobType,
      skills: skills.length > 0 ? skills.join(",") : undefined,
      fresher: fresherOnly,
      minSalary: minLpa > 0 ? minLpa * 100000 : undefined,
      sort,
      page: newPage,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* ── Header & Search Bar ─────────────────────────────────────────── */}
      <div className="mb-8 space-y-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-[-0.01em] text-emerald-dark">
            Explore Open Roles
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Curated opportunities with transparent salary brackets and verified eligibility.
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-cream p-3 rounded-card border border-border shadow-emerald-sm flex flex-col md:flex-row items-center gap-3">
          <div className="flex-1 w-full flex items-center gap-2.5 px-3 py-2 bg-cream-input border border-border/60 rounded-ui focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/20">
            <Search className="w-4 h-4 text-emerald shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by job title, skill, or keyword..."
              className="w-full bg-transparent text-sm placeholder:text-muted/60 focus:outline-none"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="text-muted hover:text-body">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="w-full md:w-64 flex items-center gap-2.5 px-3 py-2 bg-cream-input border border-border/60 rounded-ui focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/20">
            <MapPin className="w-4 h-4 text-emerald shrink-0" />
            <input
              type="text"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder="Location or city..."
              className="w-full bg-transparent text-sm placeholder:text-muted/60 focus:outline-none"
            />
            {cityInput && (
              <button onClick={() => setCityInput("")} className="text-muted hover:text-body">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Layout: Filters Sidebar + Results ──────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Filters Sidebar */}
        <aside className="w-full lg:w-72 bg-cream border border-border rounded-card p-5 shadow-emerald-sm shrink-0 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2 font-semibold text-base text-emerald-dark">
              <SlidersHorizontal className="w-4 h-4 text-gold" />
              <span>Filter Roles</span>
            </div>
            <button
              onClick={handleClearFilters}
              className="text-xs text-gold hover:text-emerald-dark font-semibold underline"
            >
              Clear all
            </button>
          </div>

          {/* Fresher Only Toggle */}
          <div className="p-3 bg-gold-light rounded-ui border border-gold/40 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold uppercase text-emerald-dark tracking-wide flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-gold" />
                Fresher Friendly
              </span>
              <p className="text-[11px] text-body/80">0 years experience</p>
            </div>
            <input
              type="checkbox"
              id="fresherToggle"
              checked={fresherOnly}
              onChange={(e) => setFresherOnly(e.target.checked)}
              className="h-4 w-4 rounded text-emerald border-border focus:ring-gold"
            />
          </div>

          {/* Work Mode */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted">
              Work Mode
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(["onsite", "remote", "hybrid"] as WorkMode[]).map((mode) => {
                const isSelected = workMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setWorkMode(isSelected ? undefined : mode)}
                    className={`py-1.5 text-xs font-medium rounded-ui transition-all capitalize border ${
                      isSelected
                        ? "bg-emerald text-white border-emerald shadow-emerald-sm"
                        : "bg-cream-input text-body border-border hover:bg-white"
                    }`}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Job Type */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted">
              Job Type
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(
                [
                  ["full_time", "Full Time"],
                  ["internship", "Internship"],
                  ["part_time", "Part Time"],
                  ["contract", "Contract"],
                ] as const
              ).map(([type, label]) => {
                const isSelected = jobType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setJobType(isSelected ? undefined : (type as JobType))}
                    className={`py-1.5 px-2 text-xs font-medium rounded-ui transition-all border ${
                      isSelected
                        ? "bg-emerald text-white border-emerald shadow-emerald-sm"
                        : "bg-cream-input text-body border-border hover:bg-white"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Minimum Annual Salary Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
              <span className="text-muted">Min Salary</span>
              <span className="text-emerald-dark font-bold text-sm tabular-nums">
                {minLpa > 0 ? `₹${minLpa} LPA+` : "Any"}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              step={1}
              value={minLpa}
              onChange={(e) => setMinLpa(Number(e.target.value))}
              className="w-full accent-gold cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted font-medium">
              <span>₹0</span>
              <span>₹15 LPA</span>
              <span>₹30 LPA</span>
            </div>
          </div>
        </aside>

        {/* Results Area */}
        <div className="flex-1 w-full space-y-6">
          {/* Controls Bar: Counts & Sort */}
          <div className="bg-cream border border-border rounded-ui p-3 px-4 shadow-emerald-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted font-medium">
              Showing <strong className="text-emerald-dark font-semibold text-sm tabular-nums">{total}</strong>{" "}
              open position{total === 1 ? "" : "s"}
            </p>

            <div className="flex items-center gap-2">
              <label htmlFor="sortSelect" className="text-xs text-muted uppercase font-bold">
                Sort:
              </label>
              <select
                id="sortSelect"
                value={sort}
                onChange={(e) => setSort(e.target.value as "latest" | "salary")}
                className="bg-cream-input border border-border text-xs font-semibold rounded-ui py-1.5 pl-2.5 pr-8 focus:outline-none focus:border-gold cursor-pointer"
              >
                <option value="latest">Latest Postings</option>
                <option value="salary">Highest Salary</option>
              </select>
            </div>
          </div>

          {/* Results Grid */}
          {isLoading && !data ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-card" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <EmptyState
              title="No jobs matched your criteria"
              description="Try adjusting your filters, clearing your keywords, or checking back soon as recruiters publish new listings."
              actionLabel="Clear all filters"
              onAction={handleClearFilters}
            />
          ) : (
            <div
              className={`grid grid-cols-1 md:grid-cols-2 gap-5 transition-opacity ${
                isPlaceholderData ? "opacity-60" : "opacity-100"
              }`}
            >
              {jobs.map((job) => (
                <JobCard key={job._id} job={job} />
              ))}
            </div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
};

