import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password123", 10);

  // Admin / organizer account.
  const admin = await prisma.user.upsert({
    where: { email: "admin@socaltechdiaspora.org" },
    update: {},
    create: {
      name: "Community Organizer",
      email: "admin@socaltechdiaspora.org",
      passwordHash: password,
      linkedinUrl: "https://linkedin.com/in/organizer",
      title: "Community Lead",
      company: "SoCal Tech Diaspora",
      bio: "Building the SoCal Ukrainian tech community.",
      whatINeed: "Volunteers and event hosts",
      howICanHelp: "Connecting members, organizing events",
      tags: ["community", "events"],
      isApproved: true,
      isAdmin: true,
    },
  });

  // A few sample approved members.
  const samples = [
    {
      name: "Olena Kovalenko",
      email: "olena@example.com",
      title: "Senior Frontend Engineer",
      company: "Fintech Co",
      whatINeed: "Referrals into product roles",
      howICanHelp: "React mentorship, interview prep",
      tags: ["React", "TypeScript", "mentorship"],
    },
    {
      name: "Andriy Bondarenko",
      email: "andriy@example.com",
      title: "Founder",
      company: "Stealth Startup",
      whatINeed: "A technical co-founder and early users",
      howICanHelp: "Fundraising intros, startup advice",
      tags: ["fundraising", "founder", "product"],
    },
    {
      name: "Iryna Shevchenko",
      email: "iryna@example.com",
      title: "Product Designer",
      company: "Design Studio",
      whatINeed: "Freelance design projects",
      howICanHelp: "UX reviews, portfolio feedback",
      tags: ["design", "UX", "Figma"],
    },
  ];

  for (const s of samples) {
    await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        name: s.name,
        email: s.email,
        passwordHash: password,
        linkedinUrl: `https://linkedin.com/in/${s.name
          .toLowerCase()
          .replace(/\s+/g, "-")}`,
        title: s.title,
        company: s.company,
        whatINeed: s.whatINeed,
        howICanHelp: s.howICanHelp,
        tags: s.tags,
        isApproved: true,
        invitedByUserId: admin.id,
      },
    });
  }

  // A sample upcoming event.
  const existing = await prisma.event.findFirst({
    where: { title: "SoCal Ukrainian Tech Mixer" },
  });
  if (!existing) {
    await prisma.event.create({
      data: {
        title: "SoCal Ukrainian Tech Mixer",
        description:
          "Casual evening meetup for founders, engineers, and newcomers. Drinks, intros, and good company. Bring a friend!",
        dateTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14), // +2 weeks
        address: "Cross Campus, Santa Monica, CA",
        createdByUserId: admin.id,
      },
    });
  }

  console.log("Seed complete.");
  console.log("Admin login: admin@socaltechdiaspora.org / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
