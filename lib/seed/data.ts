import type { CareerRoleDoc } from "@/types/roadmap";

/** The 10 career roles from the Career Roadmap Planner prototype (median pay from the prototype's sample data). */
export const SEED_ROLES: Record<string, CareerRoleDoc> = {
  "data-analyst": { title: "Data Analyst", field: "Data & Technology", medianPay: 83640, requiredDegree: "Bachelor's" },
  "software-developer": { title: "Software Developer", field: "Data & Technology", medianPay: 132270, requiredDegree: "Bachelor's" },
  "cybersecurity-analyst": { title: "Cybersecurity Analyst", field: "Data & Technology", medianPay: 120360, requiredDegree: "Bachelor's" },
  "registered-nurse": { title: "Registered Nurse", field: "Health", medianPay: 86070, requiredDegree: "BSN + RN license" },
  "financial-analyst": { title: "Financial Analyst", field: "Business", medianPay: 99010, requiredDegree: "Bachelor's" },
  accountant: { title: "Accountant (CPA track)", field: "Business", medianPay: 79880, requiredDegree: "Bachelor's + 150 credits for CPA" },
  "ux-designer": { title: "UX Designer", field: "Design", medianPay: 92750, requiredDegree: "Bachelor's + portfolio" },
  "mechanical-engineer": { title: "Mechanical Engineer", field: "Engineering", medianPay: 99510, requiredDegree: "ABET-accredited BS in ME" },
  "physical-therapist": { title: "Physical Therapist", field: "Health", medianPay: 99710, requiredDegree: "Doctor of Physical Therapy (DPT)" },
  "market-research-analyst": { title: "Market Research Analyst", field: "Business", medianPay: 74680, requiredDegree: "Bachelor's" },
};

/** Profiles for the Sprint 1 demo accounts in lib/auth.ts (ids s1, s2). */
export const SEED_PROFILES = {
  s1: { username: "jalvarez", name: "Jordan Alvarez", email: "jalvarez@charlotte.edu", major: "Information Systems" },
  s2: { username: "athompson", name: "Aisha Thompson", email: "athompson@charlotte.edu", major: "Kinesiology" },
} as const;
