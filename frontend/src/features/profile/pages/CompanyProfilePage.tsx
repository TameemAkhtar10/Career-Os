"use client";

import React, { useState, useEffect } from "react";
import { useProfileMe, useUpdateRecruiterProfile } from "../hooks/useProfile";
import { RecruiterProfile } from "../../../types/profile";
import { recruiterProfileSchema } from "../schemas";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { BrandLoader } from "../../../components/feedback/BrandLoader";
import { CompanyProfileWarningBanner } from "../../recruiter/components/CompanyProfileWarningBanner";
import { LogoUploader } from "../components/LogoUploader";
import { toast } from "sonner";
import {
  Building2,
  Globe,
  MapPin,
  Users,
  Briefcase,
  CheckCircle,
  Save,
  ShieldCheck,
} from "lucide-react";

export const CompanyProfilePage: React.FC = () => {
  const { data: profileMe, isLoading } = useProfileMe();
  const updateMutation = useUpdateRecruiterProfile();

  const profile = (profileMe as RecruiterProfile) || null;

  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [location, setLocation] = useState("");
  const [designation, setDesignation] = useState("");
  const [about, setAbout] = useState("");

  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (profile) {
      setCompanyName(profile.companyName || "");
      setCompanyWebsite(profile.companyWebsite || "");
      setCompanyLogoUrl(profile.companyLogoUrl || "");
      setIndustry(profile.industry || "");
      setCompanySize(profile.companySize || "");
      setLocation(profile.location || "");
      setDesignation(profile.designation || "");
      setAbout(profile.about || "");
      setIsDirty(false);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      companyName: companyName.trim(),
      companyWebsite: companyWebsite.trim() || undefined,
      companyLogoUrl: companyLogoUrl.trim() || undefined,
      industry: industry.trim() || undefined,
      companySize: companySize.trim() || undefined,
      location: location.trim() || undefined,
      designation: designation.trim() || undefined,
      about: about.trim() || undefined,
    };

    const validation = recruiterProfileSchema.safeParse(payload);
    if (!validation.success) {
      const firstError = validation.error.errors[0]?.message || "Please fix validation errors.";
      toast.error(firstError);
      return;
    }

    try {
      await updateMutation.mutateAsync(payload);
      setIsDirty(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to save company profile.";
      toast.error(msg);
    }
  };

  if (isLoading) {
    return <BrandLoader message="Loading company profile..." />;
  }

  return (
    <>
      <CompanyProfileWarningBanner />
      <div className="min-h-screen bg-champagne/40 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-2xl sm:text-3xl font-bold text-emerald-ink">
                  Company Profile
                </h1>
                {profile?.isVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald/10 border border-emerald/30 text-xs font-semibold text-emerald-dark">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Company
                  </span>
                )}
              </div>
              <p className="text-sm text-body-text/70 mt-1">
                Your company details are displayed on all your active job postings and candidate touchpoints.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Primary Details */}
            <Card className="p-6 sm:p-8 bg-cream border-champagne-border space-y-5">
              <div className="flex items-center gap-2 border-b border-champagne-border/60 pb-3">
                <Building2 className="w-5 h-5 text-gold-accent" />
                <h2 className="font-heading text-lg font-bold text-emerald-ink">
                  Company Identity
                </h2>
              </div>

              {/* Logo Uploader */}
              <LogoUploader
                currentLogoUrl={profile?.companyLogoUrl}
                onLogoChange={(url) => {
                  setCompanyLogoUrl(url);
                }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Input
                    label="Company Name *"
                    placeholder="e.g. Acme Innovations Pvt. Ltd."
                    maxLength={150}
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value);
                      setIsDirty(true);
                    }}
                    required
                    helperText="This name appears as the employer on all published job listings."
                  />
                </div>

                <Input
                  label="Official Website URL"
                  placeholder="https://example.com"
                  maxLength={500}
                  value={companyWebsite}
                  onChange={(e) => {
                    setCompanyWebsite(e.target.value);
                    setIsDirty(true);
                  }}
                />

                <Input
                  label="Company Logo Image URL"
                  placeholder="https://example.com/logo.png"
                  maxLength={1000}
                  value={companyLogoUrl}
                  onChange={(e) => {
                    setCompanyLogoUrl(e.target.value);
                    setIsDirty(true);
                  }}
                  helperText="Direct image URL for your brand logo."
                />

                <Input
                  label="Industry"
                  placeholder="e.g. Fintech, Healthcare, Cloud SaaS"
                  maxLength={100}
                  value={industry}
                  onChange={(e) => {
                    setIndustry(e.target.value);
                    setIsDirty(true);
                  }}
                />

                <div>
                  <label className="block text-xs font-semibold text-emerald-ink mb-1">
                    Company Size
                  </label>
                  <select
                    value={companySize}
                    onChange={(e) => {
                      setCompanySize(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-champagne/20 border border-champagne-border text-body-text focus:outline-none focus:ring-2 focus:ring-gold-accent transition-all h-10"
                  >
                    <option value="">Select company size</option>
                    <option value="1-10">1-10 employees (Startup)</option>
                    <option value="11-50">11-50 employees (Early Stage)</option>
                    <option value="51-200">51-200 employees (Growth)</option>
                    <option value="201-500">201-500 employees (Scale-up)</option>
                    <option value="500+">500+ employees (Enterprise)</option>
                  </select>
                </div>

                <Input
                  label="Headquarters / Location"
                  placeholder="e.g. Bengaluru, Karnataka"
                  maxLength={150}
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setIsDirty(true);
                  }}
                />

                <Input
                  label="Your Designation"
                  placeholder="e.g. Head of Talent Acquisition"
                  maxLength={100}
                  value={designation}
                  onChange={(e) => {
                    setDesignation(e.target.value);
                    setIsDirty(true);
                  }}
                />

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-emerald-ink mb-1">
                    About the Company
                  </label>
                  <textarea
                    rows={4}
                    maxLength={3000}
                    value={about}
                    onChange={(e) => {
                      setAbout(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="Describe your organization's mission, work culture, and what makes working at your company special..."
                    className="w-full px-3 py-2 text-sm rounded-xl bg-champagne/20 border border-champagne-border text-body-text placeholder:text-body-text/40 focus:outline-none focus:ring-2 focus:ring-gold-accent transition-all resize-none"
                  />
                  <span className="text-[11px] text-body-text/60 block mt-1">
                    {about.length} / 3000 characters
                  </span>
                </div>
              </div>
            </Card>

            {/* Save Status Bar */}
            <div className="flex items-center justify-between p-4 bg-cream rounded-2xl border border-champagne-border shadow-soft-emerald">
              <span className="text-xs text-body-text/70">
                {isDirty ? (
                  <span className="text-gold-accent font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gold-accent animate-pulse" />
                    You have unsaved changes
                  </span>
                ) : (
                  <span className="text-emerald-ink flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald" />
                    All changes saved
                  </span>
                )}
              </span>

              <Button
                type="submit"
                variant="primary"
                className="gap-2"
                isLoading={updateMutation.isPending}
              >
                <Save className="w-4 h-4" />
                Save Company Profile
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

