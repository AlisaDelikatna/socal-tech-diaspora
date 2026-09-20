import { Suspense } from "react";
import Link from "next/link";
import LoginForm from "./LoginForm";

export const metadata = {
  title: "Log in — Kolo Founders Circle",
};

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-20">
      <h1 className="text-2xl font-extrabold">Welcome back</h1>
      <p className="mt-1 text-muted text-sm">
        Log in to connect with members, message, and RSVP.
      </p>
      <div className="mt-8">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
      <p className="mt-6 text-center text-sm text-muted">
        Not a member yet?{" "}
        <Link href="/join" className="text-brand hover:underline">
          Apply to join
        </Link>
      </p>
    </div>
  );
}
