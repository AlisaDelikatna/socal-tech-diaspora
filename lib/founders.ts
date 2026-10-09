// Founders shown on the home page. Name, headline, and photo were copied from
// each founder's LinkedIn profile (LinkedIn photo URLs expire, so photos are
// stored locally in public/founders/). Update here when a profile changes.

export type Founder = {
  name: string;
  headline: string;
  photo: string;
  linkedinUrl: string;
};

export const founders: Founder[] = [
  {
    name: "Alisa Delikatna",
    headline: "GTM Marketing & Operations",
    photo: "/founders/alisa-delikatna.jpg",
    linkedinUrl: "https://www.linkedin.com/in/alisa-delikatna/",
  },
  {
    name: "Adrian Cyhan",
    headline: "Partner at Stubbs Alderton & Markiles, LLP",
    photo: "/founders/adrian-cyhan.jpg",
    linkedinUrl: "https://www.linkedin.com/in/adriancyhan/",
  },
  {
    name: "Nick (Mykola) Akhtyrskyi",
    headline: "Founder at Growth Runners [Marketing Agency]",
    photo: "/founders/nick-akhtyrskyi.jpg",
    linkedinUrl:
      "https://www.linkedin.com/in/nick-mykola-akhtyrskyi-882555120/",
  },
  {
    name: "Stanislav Prykhodko",
    headline: "B2B Sales Systems for Service Businesses",
    photo: "/founders/stanislav-prykhodko.jpg",
    linkedinUrl: "https://www.linkedin.com/in/stanislav-prykhodko/",
  },
];
