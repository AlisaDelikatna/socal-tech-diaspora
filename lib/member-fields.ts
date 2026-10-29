// Structured profile fields used for filtering (e.g. who to invite to speak).
// Values are stored as-is, so only append or rename with a data migration.

export const MEMBER_ROLES = [
  "Founder / Co-founder",
  "Angel investor",
  "VC / Fund",
  "Executive / Operator",
  "Engineering",
  "Product",
  "Design",
  "Marketing / Sales / GTM",
  "Legal / Finance / Advisor",
  "Student / Exploring",
  "Other",
] as const;

export const INDUSTRIES = [
  "AI / ML",
  "SaaS / B2B software",
  "Fintech",
  "E-commerce / DTC",
  "Health / Biotech",
  "Climate / Energy",
  "Media / Entertainment",
  "Real estate / PropTech",
  "Defense / GovTech",
  "Education",
  "Consumer apps",
  "Hardware / Robotics",
  "Marketing / Agency services",
  "Legal / Professional services",
  "Other",
] as const;

export const MAX_INDUSTRIES = 3;
