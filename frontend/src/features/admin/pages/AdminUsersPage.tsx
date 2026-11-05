"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../services/admin.api";
import { AdminUser } from "../../../types/admin";
import { useAuth } from "../../../providers/AuthProvider";
import { ApiClientError } from "../../../config/api";
import { Card } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Skeleton } from "../../../components/ui/Skeleton";
import { Pagination } from "../../../components/ui/Pagination";
import { toast } from "sonner";
import { Search, ShieldCheck, ShieldOff } from "lucide-react";

const ROLES = ["all", "candidate", "recruiter", "admin"] as const;
const STATUSES = ["all", "active", "suspended"] as const;

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export const AdminUsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const debouncedQ = useDebounce(q, 400);

  // Confirm dialog state
  const [confirmTarget, setConfirmTarget] = useState<{ user: AdminUser; newStatus: "active" | "suspended" } | null>(null);
  const [verifyTarget, setVerifyTarget] = useState<{ user: AdminUser; newVerified: boolean } | null>(null);

  const { data: res, isLoading } = useQuery({
    queryKey: ["admin", "users", role, status, debouncedQ, page],
    queryFn: () =>
      adminApi.getUsers({
        role: role === "all" ? undefined : role,
        status: status === "all" ? undefined : status,
        q: debouncedQ || undefined,
        page,
        limit: 15,
      }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: "active" | "suspended" }) =>
      adminApi.updateUserStatus(id, newStatus),
    onMutate: async ({ id, newStatus }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["admin", "users"] });
      const previous = queryClient.getQueryData(["admin", "users", role, status, debouncedQ, page]);
      queryClient.setQueryData(["admin", "users", role, status, debouncedQ, page], (old: any) => {
        if (!old?.data?.users) return old;
        return {
          ...old,
          data: {
            ...old.data,
            users: old.data.users.map((u: AdminUser) =>
              u._id === id ? { ...u, status: newStatus } : u
            ),
          },
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(["admin", "users", role, status, debouncedQ, page], context?.previous);
      toast.error("Failed to update user status.");
    },
    onSuccess: () => {
      toast.success("User status updated.");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: ({ userId, isVerified }: { userId: string; isVerified: boolean }) =>
      adminApi.verifyRecruiter(userId, isVerified),
    onSuccess: () => {
      toast.success("Recruiter verification updated.");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: () => toast.error("Failed to update verification."),
  });

  const users = res?.data?.users ?? [];
  const totalPages = res?.data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-emerald-ink">User Management</h1>
        <p className="text-sm text-body-text/70 mt-1">
          {res?.data?.total != null ? `${res.data.total} users total` : ""}
        </p>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-cream border-champagne-border">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body-text/40" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-champagne/20 border border-champagne-border text-body-text placeholder:text-body-text/40 focus:outline-none focus:ring-2 focus:ring-gold-accent"
            />
          </div>

          {/* Role filter */}
          <select
            value={role}
            onChange={(e) => { setRole(e.target.value); setPage(1); }}
            className="text-sm px-3 py-2 rounded-xl border border-champagne-border bg-cream focus:outline-none focus:ring-2 focus:ring-gold-accent"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>{r === "all" ? "All Roles" : r.charAt(0).toUpperCase() + r.slice(1)}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="text-sm px-3 py-2 rounded-xl border border-champagne-border bg-cream focus:outline-none focus:ring-2 focus:ring-gold-accent"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card className="bg-cream border-champagne-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-champagne/30 border-b border-champagne-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-emerald-ink">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-emerald-ink">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-emerald-ink">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-emerald-ink">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-emerald-ink">Joined</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-emerald-ink">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-champagne-border/40">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                : users.map((u) => {
                    const isSelf = u._id === currentUser?._id;
                    const isAdmin = u.role === "admin";
                    const canModify = !isSelf && !isAdmin;

                    return (
                      <tr key={u._id} className="border-b border-champagne-border/40 hover:bg-champagne/10 transition-colors">
                        <td className="px-4 py-3 font-medium text-emerald-ink">{u.name}</td>
                        <td className="px-4 py-3 text-body-text/70 text-xs">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs capitalize px-2 py-0.5 rounded-full bg-champagne text-emerald-ink font-medium">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            u.status === "active"
                              ? "bg-emerald/10 text-emerald-dark"
                              : "bg-error-bg text-error-red"
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-body-text/60">
                          {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {canModify && (
                              <Button
                                variant={u.status === "active" ? "ghost" : "outline"}
                                size="sm"
                                onClick={() => setConfirmTarget({
                                  user: u,
                                  newStatus: u.status === "active" ? "suspended" : "active",
                                })}
                                className={`text-xs ${u.status === "active" ? "text-error-red hover:bg-error-bg" : "text-emerald-dark"}`}
                                disabled={statusMutation.isPending}
                              >
                                {u.status === "active" ? "Suspend" : "Activate"}
                              </Button>
                            )}
                            {u.role === "recruiter" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setVerifyTarget({ user: u, newVerified: !(u as any).isVerified })}
                                className="text-xs text-emerald-dark gap-1"
                                disabled={verifyMutation.isPending}
                              >
                                {(u as any).isVerified
                                  ? <><ShieldOff className="w-3.5 h-3.5" /> Unverify</>
                                  : <><ShieldCheck className="w-3.5 h-3.5" /> Verify</>
                                }
                              </Button>
                            )}
                            {!canModify && (
                              <span className="text-xs text-body-text/40 italic">
                                {isSelf ? "You" : "Admin"}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>

          {!isLoading && users.length === 0 && (
            <div className="text-center py-12 text-sm text-body-text/60">
              No users found matching your filters.
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-champagne-border flex justify-center">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </Card>

      {/* Confirm Status Change Dialog */}
      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-cream border border-champagne-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl space-y-4">
            <h3 className="font-heading text-lg font-bold text-emerald-ink">
              {confirmTarget.newStatus === "suspended" ? "Suspend User?" : "Activate User?"}
            </h3>
            <p className="text-sm text-body-text/70">
              {confirmTarget.newStatus === "suspended"
                ? `Suspending "${confirmTarget.user.name}" will prevent them from logging in.`
                : `Activating "${confirmTarget.user.name}" will restore their access.`}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirmTarget(null)} disabled={statusMutation.isPending}>
                Cancel
              </Button>
              <Button
                variant={confirmTarget.newStatus === "suspended" ? "danger" : "primary"}
                isLoading={statusMutation.isPending}
                onClick={() => {
                  statusMutation.mutate({ id: confirmTarget.user._id, newStatus: confirmTarget.newStatus });
                  setConfirmTarget(null);
                }}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Verify Dialog */}
      {verifyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-cream border border-champagne-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl space-y-4">
            <h3 className="font-heading text-lg font-bold text-emerald-ink">
              {verifyTarget.newVerified ? "Verify Recruiter?" : "Remove Verification?"}
            </h3>
            <p className="text-sm text-body-text/70">
              {verifyTarget.newVerified
                ? `Mark "${verifyTarget.user.name}" as a verified company recruiter?`
                : `Remove the verified badge from "${verifyTarget.user.name}"?`}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setVerifyTarget(null)} disabled={verifyMutation.isPending}>
                Cancel
              </Button>
              <Button
                variant="primary"
                isLoading={verifyMutation.isPending}
                onClick={() => {
                  verifyMutation.mutate({ userId: verifyTarget.user._id, isVerified: verifyTarget.newVerified });
                  setVerifyTarget(null);
                }}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

