"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { ROUTES } from "../../../constants/routes";
import { HelpCircle, ChevronDown, ChevronUp, ArrowRight, Mail } from "lucide-react";

interface FaqItem {
  question: string;
  answer: React.ReactNode;
  category: "Candidates" | "Recruiters" | "General";
}

const FAQS: FaqItem[] = [
  {
    category: "Candidates",
    question: "How does Career OS work for job seekers and freshers?",
    answer: (
      <p>
        After creating an account and verifying your email with a one-time code (OTP), you can build
        your profile with skills, education, and project links, and upload your PDF resume. You can
        browse open listings, check skill overlap scores, and apply in one click. As recruiters review
        your application, you receive real-time status updates right on your dashboard and via email.
      </p>
    ),
  },
  {
    category: "Candidates",
    question: "Is Career OS free for candidates?",
    answer: (
      <p>
        Yes, Career OS is 100% free for candidates. There are no premium tiers, hidden application
        fees, or paywalled job listings. We strictly prohibit recruiters from charging application fees
        or training deposits.
      </p>
    ),
  },
  {
    category: "Candidates",
    question: "Who can view my resume, phone number, and contact details?",
    answer: (
      <div className="space-y-2">
        <p>
          Your contact details and uploaded resume are private. They are <strong>only shared with the specific recruiter</strong> whose job posting you submit an application to. We do not provide an open, searchable resume database, and we never sell your records to recruiters or third parties.
        </p>
        <p>
          If you choose to use our optional <strong>Resume Score Checker</strong>, your resume text is first locally redacted to strip your name, email, phone number, personal links, and address. This redacted text is sent to a third-party AI provider (currently Groq) to generate constructive feedback and suggestions. We never store raw resume text in the analysis database; only the generated scores, keyword presence lists, and recommendations are saved for your review. You can withdraw your AI consent at any time from the scan history drawer or delete individual scans and all records from your account.
        </p>
      </div>
    ),
  },
  {
    category: "Candidates",
    question: "How does the Skill Match score work?",
    answer: (
      <p>
        The match score is calculated transparently by comparing the skills listed on your candidate
        profile with the required skill tags on the job listing. Having relevant skills listed directly
        enhances your match percentage, helping both you and the recruiter evaluate mutual alignment.
      </p>
    ),
  },
  {
    category: "General",
    question: "What does the 'Fresher Friendly' badge mean?",
    answer: (
      <p>
        Job listings with minimum required experience set to 0 years are automatically marked with the
        <strong> Fresher Friendly</strong> badge. This makes it effortless for new graduates, students,
        and career switchers to identify roles where prior industry years are not a mandatory prerequisite.
      </p>
    ),
  },
  {
    category: "Recruiters",
    question: "How do recruiters post openings and manage applicants?",
    answer: (
      <p>
        Verified recruiters can post openings specifying title, required skills, work mode (remote, hybrid,
        onsite), and application deadline. From the recruiter dashboard, employers can review applicants
        ranked by skill match score, read cover notes, view resumes, and update application statuses
        (shortlisted, rejected, hired) in real time.
      </p>
    ),
  },
  {
    category: "General",
    question: "What emails will I receive, and how do I manage notifications?",
    answer: (
      <p>
        You receive essential transactional emails (verification OTPs, password resets, application
        confirmations, and status change notices). We also offer optional daily job alerts for candidates,
        applicant digests for recruiters, and weekly profile tips. Every automated digest contains a 1-click
        unsubscribe link, and you can customize your preferences anytime in{" "}
        <Link href={ROUTES.ACCOUNT} className="text-emerald font-semibold underline hover:text-gold">
          Account Settings
        </Link>
        .
      </p>
    ),
  },
  {
    category: "General",
    question: "How do I export my data or permanently delete my account?",
    answer: (
      <p>
        You have complete data sovereignty. In your{" "}
        <Link href={ROUTES.ACCOUNT} className="text-emerald font-semibold underline hover:text-gold">
          Account Settings
        </Link>
        , click <strong>Download my data</strong> to export a complete JSON file of your profile and
        applications. You can also permanently delete your account by confirming your password in the Danger Zone,
        which immediately wipes your credentials, resume, and application history from our database.
      </p>
    ),
  },
];

export const FaqPage: React.FC = () => {
  const [openIndices, setOpenIndices] = useState<number[]>([0, 1]);
  const [activeTab, setActiveTab] = useState<"All" | "Candidates" | "Recruiters" | "General">("All");

  const toggleFaq = (index: number) => {
    setOpenIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const filteredFaqs = FAQS.filter(
    (faq) => activeTab === "All" || faq.category === activeTab
  );

  return (
    <div className="min-h-screen bg-champagne/40 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-badge bg-champagne border border-border text-emerald text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5 text-gold" />
            <span>Got Questions?</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-emerald-dark tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-sm text-body/80 leading-relaxed">
            Honest, straightforward answers about how Career OS works for candidates, recruiters, and hiring managers.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {(["All", "Candidates", "Recruiters", "General"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-ui text-xs font-semibold transition-all ${
                activeTab === tab
                  ? "bg-emerald text-white shadow-emerald-sm"
                  : "bg-cream text-body/80 border border-border hover:bg-champagne/60"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* FAQs Accordion */}
        <div className="space-y-4">
          {filteredFaqs.map((faq, index) => {
            const isOpen = openIndices.includes(index);

            return (
              <Card
                key={index}
                className="p-5 sm:p-6 bg-cream border-border transition-all hover:border-gold/50 shadow-emerald-sm"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-start justify-between gap-4 text-left focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="font-display text-base sm:text-lg font-bold text-emerald-dark leading-snug">
                    {faq.question}
                  </span>
                  <span className="p-1 rounded-ui bg-champagne/60 text-emerald shrink-0 mt-0.5">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </button>

                {isOpen && (
                  <div className="mt-4 pt-3 border-t border-border/50 text-xs sm:text-sm text-body/80 leading-relaxed animate-fadeIn">
                    {faq.answer}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Still Have Questions Box */}
        <Card className="p-8 bg-cream border-border shadow-emerald-sm text-center space-y-4">
          <h2 className="font-display text-xl font-bold text-emerald-dark">
            Still have a question?
          </h2>
          <p className="text-xs sm:text-sm text-muted max-w-md mx-auto leading-relaxed">
            Need help with your account or have a specific question not covered here? Reach out directly
            to our support team.
          </p>
          <div className="pt-2">
            <Link href={ROUTES.CONTACT}>
              <Button variant="outline" size="sm" className="gap-2">
                <Mail className="w-4 h-4" />
                Contact Support
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

