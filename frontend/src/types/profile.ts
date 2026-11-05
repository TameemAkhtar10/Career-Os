export interface EducationItem {
  degree: string;
  institute: string;
  year?: number | null;
  grade?: string;
}

export interface ExperienceItem {
  title: string;
  company: string;
  from?: string | null;
  to?: string | null;
  description?: string;
}

export interface ProjectItem {
  title: string;
  description?: string;
  link?: string;
  techStack?: string[];
}

export interface ProfileLinks {
  github?: string;
  linkedin?: string;
  portfolio?: string;
}

export interface ResumeInfo {
  fileId?: string;
  fileName?: string;
  size?: number;
  uploadedAt?: string;
}

export interface CandidateProfile {
  _id?: string;
  user?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  headline: string;
  about: string;
  phone?: string;
  location: {
    city: string;
    state: string;
  };
  education: EducationItem[];
  skills: string[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  links: ProfileLinks;
  resumeUrl: string;
  resume?: ResumeInfo;
  openToWork: boolean;
  expectedRole: string;
  profileCompleteness?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface RecruiterProfile {
  _id?: string;
  user?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  companyName: string;
  companyWebsite?: string;
  companyLogoUrl?: string;
  industry?: string;
  companySize?: string;
  about?: string;
  location?: string;
  designation?: string;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

