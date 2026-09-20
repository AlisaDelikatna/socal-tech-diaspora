import { Suspense } from "react";
import JoinForm from "./JoinForm";

export const metadata = {
  title: "Become a Member — Kolo Founders Circle",
};

export default function JoinPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-3xl font-extrabold">Become a Member</h1>
      <p className="mt-2 text-muted">
        Applications are reviewed by a community organizer before your profile
        goes live — it keeps this a trust-based space. You&apos;ll get an email
        once you&apos;re approved.
      </p>
      <div className="mt-8">
        <Suspense fallback={null}>
          <JoinForm />
        </Suspense>
      </div>
    </div>
  );
}
