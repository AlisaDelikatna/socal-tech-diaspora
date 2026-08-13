import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(2, "Please enter your full name"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  linkedinUrl: z
    .string()
    .url("Enter a valid URL")
    .refine((v) => v.includes("linkedin.com"), "Must be a LinkedIn profile URL"),
  title: z.string().min(2, "Enter your current role or title"),
  company: z.string().optional().or(z.literal("")),
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
  address: z.string().min(2),
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
