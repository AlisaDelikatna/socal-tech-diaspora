export type OAuthProvider = "linkedin" | "google";

export const OAUTH_LABELS: Record<OAuthProvider, string> = {
  linkedin: "LinkedIn",
  google: "Google",
};
