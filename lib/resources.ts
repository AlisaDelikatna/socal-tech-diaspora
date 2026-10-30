export const CATEGORIES = {
  education: {
    label: "Education",
    subcategories: {
      courses: "Courses",
      videos: "Online Videos",
    },
  },
  opportunities: {
    label: "Opportunities",
    subcategories: {
      funding: "Funding",
      "co-founder": "Co-Founder Match",
      jobs: "Jobs",
      speaking: "Speaker Opportunities",
      sponsorships: "Sponsorships",
      donations: "Donations",
    },
  },
} as const;

// Open speaker slots and the pitch-a-talk form live here.
export const SPEAKING_PATH = "/resources/opportunities/speaking";

export type Category = keyof typeof CATEGORIES;
export type Subcategory =
  | keyof (typeof CATEGORIES)["education"]["subcategories"]
  | keyof (typeof CATEGORIES)["opportunities"]["subcategories"];

export function getCategoryLabel(cat: string): string {
  return CATEGORIES[cat as Category]?.label ?? cat;
}

export function getSubcategoryLabel(sub: string): string {
  for (const cat of Object.values(CATEGORIES)) {
    const label = (cat.subcategories as Record<string, string>)[sub];
    if (label) return label;
  }
  return sub;
}
