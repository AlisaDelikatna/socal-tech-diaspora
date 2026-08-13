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
      donations: "Donations",
    },
  },
} as const;

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
