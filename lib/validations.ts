import { z } from "zod";
import { MEMBER_ROLES, INDUSTRIES, MAX_INDUSTRIES } from "@/lib/member-fields";

const roleField = z.enum(MEMBER_ROLES, { message: "Choose the role that fits you best" });
const industriesField = z
  .array(z.enum(INDUSTRIES))
  .max(MAX_INDUSTRIES, `Pick up to ${MAX_INDUSTRIES} industries`)
  .default([]);

export const signupSchema = z.object({
  name: z.string().min(2, "Please enter your full name"),
  email: z.string().email("Enter a valid email address"),
  // Required unless the applicant came via LinkedIn/Google (checked in the API).
  password: z.string().optional().or(z.literal("")),
  linkedinUrl: z
    .string()
    .url("Enter a valid URL")
    .refine((v) => v.includes("linkedin.com"), "Must be a LinkedIn profile URL"),
  title: z.string().min(2, "Enter your current role or title"),
  company: z.string().optional().or(z.literal("")),
  role: roleField,
  industries: industriesField,
  whatINeed: z.string().min(3, "Tell us what you need from the community"),
  howICanHelp: z.string().min(3, "Tell us how you can help others"),
  photoUrl: z.string().url().optional().or(z.literal("")),
  ref: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(2),
  title: z.string().min(2),
  company: z.string().optional().or(z.literal("")),
  role: roleField,
  industries: industriesField,
  pronouns: z.string().optional().or(z.literal("")),
  bio: z.string().optional().or(z.literal("")),
  linkedinUrl: z
    .string()
    .url()
    .refine((v) => v.includes("linkedin.com"), "Must be a LinkedIn profile URL"),
  whatINeed: z.string().min(3),
  howICanHelp: z.string().min(3),
  photoUrl: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string()).max(15).default([]),
});

export const messageSchema = z.object({
  recipientId: z.string().min(1),
  body: z.string().min(1, "Message can't be empty").max(4000),
});

export const eventSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(2),
  dateTime: z.string().min(1), // ISO string from datetime-local input
  endDateTime: z.string().optional(),
  address: z.string().min(2),
  publicLocation: z.string().optional(),
  capacity: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().int().positive().optional()
  ),
});

export const speakerOpportunitySchema = z.object({
  eventId: z.string().min(1),
  topic: z.string().min(3, "Add a short topic"),
  description: z.string().min(10, "Describe who you're looking for"),
});

export const speakerApplicationSchema = z
  .object({
    opportunityId: z.string().min(1),
    isSelf: z.boolean(),
    // Only used when recommending someone else.
    candidateName: z.string().optional(),
    candidateEmail: z.string().optional(),
    candidateTitle: z.string().optional(),
    candidateLinkedin: z.string().optional(),
    pitch: z.string().min(20, "Tell us a bit more (at least 20 characters)").max(3000),
  })
  .superRefine((d, ctx) => {
    if (d.isSelf) return;
    if (!d.candidateName || d.candidateName.trim().length < 2) {
      ctx.addIssue({ code: "custom", path: ["candidateName"], message: "Enter their name" });
    }
    if (!z.string().email().safeParse(d.candidateEmail ?? "").success) {
      ctx.addIssue({ code: "custom", path: ["candidateEmail"], message: "Enter a valid email" });
    }
    if (d.candidateLinkedin && !z.string().url().safeParse(d.candidateLinkedin).success) {
      ctx.addIssue({ code: "custom", path: ["candidateLinkedin"], message: "Enter a valid URL" });
    }
  });

export const speakerReplySchema = z.object({
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
