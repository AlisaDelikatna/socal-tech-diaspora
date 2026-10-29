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

// Best guess at a role from a free-text job title, for members who joined
// before the role field existed. Order matters: the first match wins.
const TITLE_RULES: [RegExp, (typeof MEMBER_ROLES)[number]][] = [
  [/\b(co-?)?founder\b/i, "Founder / Co-founder"],
  [/\bangel\b/i, "Angel investor"],
  [/\b(vc|venture|investor|general partner|managing partner)\b/i, "VC / Fund"],
  [/\b(engineer|developer|cto|programmer|architect)\b/i, "Engineering"],
  [/\b(product manager|head of product|product lead|cpo)\b/i, "Product"],
  [/\b(designer|ux|ui)\b/i, "Design"],
  [/\b(marketing|sales|gtm|growth|cmo|business development)\b/i, "Marketing / Sales / GTM"],
  [/\b(attorney|lawyer|counsel|cfo|accountant|advisor|consultant)\b/i, "Legal / Finance / Advisor"],
  [/\b(ceo|coo|vp|vice president|director|head of|chief)\b/i, "Executive / Operator"],
];

export function inferRoleFromTitle(title: string): string | null {
  for (const [pattern, role] of TITLE_RULES) {
    if (pattern.test(title)) return role;
  }
  return null;
}
