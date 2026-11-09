"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { useAuth } from "../../../providers/AuthProvider";
import { logoutUser } from "../../auth/state/authSlice";
import { accountApi } from "../services/account.api";
import { ApiClientError } from "../../../config/api";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { NotificationPreferencesCard } from "../components/NotificationPreferencesCard";
import { toast } from "sonner";
import { Download, Trash2, AlertTriangle, ShieldAlert } from "lucide-react";

export const AccountPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const dispatch = useDispatch();

  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const res = await accountApi.exportData();
      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "career-os-data.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Your data has been downloaded.");
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message || "Export failed. Please try again.");
      } else {
        toast.error("Export failed. Please try again.");
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError(null);
    setIsDeleting(true);
    try {
      await accountApi.deleteAccount(deletePassword);
      dispatch(logoutUser());
      toast.success("Your account has been permanently deleted.");
      router.push("/");
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.statusCode === 401) {
          setDeleteError("Invalid password. Please try again.");
        } else {
          toast.error(err.message || "Failed to delete account.");
        }
      } else {
        toast.error("Failed to delete account. Please try again.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const dangerDescription =
    user?.role === "candidate"
      ? "Your profile, resume, and all job applications will be permanently deleted."
      : "Your jobs will be closed, your profile and company logo will be deleted.";

  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-champagne/40 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-emerald-ink">
            Account Settings
          </h1>
          <p className="text-sm text-body-text/70 mt-1">
            Manage your account data and preferences.
          </p>
        </div>

        {/* Download My Data */}
        <Card className="p-6 bg-cream border-champagne-border space-y-4">
          <div className="flex items-center gap-2 border-b border-champagne-border/60 pb-3">
            <Download className="w-5 h-5 text-gold-accent" />
            <h2 className="font-heading text-lg font-bold text-emerald-ink">Download My Data</h2>
          </div>
          <p className="text-sm text-body-text/70">
            Download a JSON export of all your Career OS data including your profile, applications, and account information.
          </p>
          <Button
            variant="outline"
            onClick={handleExportData}
            isLoading={isExporting}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Download my data
          </Button>
        </Card>

        {/* Email Notification Preferences */}
        <NotificationPreferencesCard />

        {/* Danger Zone — hidden for admin */}
        {!isAdmin && (
          <Card className="p-6 bg-cream border-error-border space-y-4">
            <div className="flex items-center gap-2 border-b border-error-border/60 pb-3">
              <ShieldAlert className="w-5 h-5 text-error-red" />
              <h2 className="font-heading text-lg font-bold text-error-red">Danger Zone</h2>
            </div>
            <div className="p-4 rounded-xl bg-error-bg/30 border border-error-border/50">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-error-red shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-error-red">Delete Account</p>
                  <p className="text-xs text-body-text/70">{dangerDescription}</p>
                  <p className="text-xs text-body-text/60 font-medium">This action is irreversible.</p>
                </div>
              </div>
              <div className="mt-4">
                <Button
                  variant="danger"
                  onClick={() => setShowDeleteDialog(true)}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Delete Account Confirm Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-cream border border-champagne-border rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-error-red" />
              <h3 className="font-heading text-xl font-bold text-emerald-ink">
                Confirm Account Deletion
              </h3>
            </div>
            <p className="text-sm text-body-text/70">
              This will permanently delete your account and all associated data. Enter your password to confirm.
            </p>

            {deleteError && (
              <div className="p-3 rounded-xl bg-error-bg border border-error-border text-error text-xs font-medium">
                {deleteError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-emerald-ink mb-1">
                Your Password
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3 py-2 text-sm rounded-xl bg-champagne/20 border border-champagne-border text-body-text placeholder:text-body-text/40 focus:outline-none focus:ring-2 focus:ring-error-border transition-all"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-champagne-border/60">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeletePassword("");
                  setDeleteError(null);
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteAccount}
                isLoading={isDeleting}
                disabled={!deletePassword}
              >
                Permanently Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

