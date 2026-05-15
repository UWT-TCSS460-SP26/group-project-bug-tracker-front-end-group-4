"use client";

import { type FormEvent, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

interface FieldError {
  path: string;
  message: string;
}

interface ValidationError {
  message: string;
  details?: FieldError[];
}

function getFieldError(path: string, errors: Record<string, string>): string {
  return errors[path] || "";
}

function Header({ session }: { session: { user?: { email?: string | null } } | null }) {
  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-zinc-900 transition-colors hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-400"
        >
          Bug Tracker
        </Link>
        {session ? (
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Dashboard
            </Link>
            <button
              onClick={() => signOut()}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Sign out
            </button>
          </div>
        ) : (
          <Link
            href="/api/auth/signin"
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}

function UnauthorizedPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <div className="flex w-full max-w-lg flex-col items-center gap-4 rounded-lg bg-white p-10 text-center shadow-sm dark:bg-zinc-900">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
          <svg
            className="h-8 w-8 text-red-600 dark:text-red-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Access denied
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          You do not have permission to access that page. Please contact an
          administrator if you believe this is a mistake.
        </p>
        <Link
          href="/"
          className="mt-2 rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}

function ErrorGate({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  if (searchParams.get("error") === "unauthorized") {
    return <UnauthorizedPage />;
  }
  return <>{children}</>;
}

export default function Home() {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    contact: "",
  });

  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "validation-error" | "network-error"
  >("idle");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverMessage, setServerMessage] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setFieldErrors({});
    setServerMessage("");

    try {
      const res = await fetch(`${apiUrl}/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.status === 201) {
        setStatus("success");
        setFormData({ title: "", body: "", contact: "" });
        return;
      }

      if (res.status === 400) {
        const data: ValidationError = await res.json();
        const errors: Record<string, string> = {};
        data.details?.forEach((d) => {
          errors[d.path] = d.message;
        });
        setFieldErrors(errors);
        setStatus("validation-error");
        return;
      }

      setServerMessage(
        "Something went wrong on our end. Please try again later."
      );
      setStatus("network-error");
    } catch {
      setServerMessage(
        "Could not reach the server. Please check your connection and try again."
      );
      setStatus("network-error");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
      <Header session={session} />

      <Suspense>
        <ErrorGate>
          <Body
            status={status}
            formData={formData}
            fieldErrors={fieldErrors}
            serverMessage={serverMessage}
            onChange={handleChange}
            onSubmit={handleSubmit}
            onReset={() => setStatus("idle")}
          />
        </ErrorGate>
      </Suspense>
    </div>
  );
}

function Body({
  status,
  formData,
  fieldErrors,
  serverMessage,
  onChange,
  onSubmit,
  onReset,
}: {
  status: string;
  formData: { title: string; body: string; contact: string };
  fieldErrors: Record<string, string>;
  serverMessage: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: FormEvent) => void;
  onReset: () => void;
}) {
  // --- Success state ---
  if (status === "success") {
    return (
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="flex w-full max-w-xl flex-col items-center gap-6 rounded-lg bg-white p-10 shadow-sm dark:bg-zinc-900">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <svg
              className="h-8 w-8 text-green-600 dark:text-green-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Issue submitted
          </h1>
          <p className="text-center text-zinc-600 dark:text-zinc-400">
            Thank you for your report. We&rsquo;ll look into it.
          </p>
          <button
            className="mt-2 rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
            onClick={onReset}
          >
            Report another issue
          </button>
        </div>
      </main>
    );
  }

  // --- Form state (idle / submitting / validation-error / network-error) ---
  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-lg bg-white p-8 shadow-sm dark:bg-zinc-900">
        <h1 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Report an issue
        </h1>
        <p className="mb-8 text-zinc-600 dark:text-zinc-400">
          Found a bug or have a suggestion? Let us know.
        </p>

        {/* Network / server error banner */}
        {status === "network-error" && serverMessage && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {serverMessage}
          </div>
        )}

        {/* Generic validation message (not field-specific) */}
        {status === "validation-error" &&
          !Object.keys(fieldErrors).length && (
            <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
              Please correct the errors below and try again.
            </div>
          )}

        <form onSubmit={onSubmit} noValidate className="space-y-5">
          {/* Title */}
          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-200"
              htmlFor="title"
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              value={formData.title}
              onChange={onChange}
              disabled={status === "submitting"}
              aria-invalid={!!getFieldError("title", fieldErrors)}
              className={`w-full rounded-lg border px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:text-zinc-50 dark:placeholder-zinc-500 ${
                getFieldError("title", fieldErrors)
                  ? "border-red-400 focus:ring-red-400"
                  : "border-zinc-300 dark:border-zinc-600"
              } bg-white dark:bg-zinc-800`}
              placeholder="Broken search"
            />
            {getFieldError("title", fieldErrors) && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {getFieldError("title", fieldErrors)}
              </p>
            )}
          </div>

          {/* Body */}
          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-200"
              htmlFor="body"
            >
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="body"
              name="body"
              required
              rows={5}
              value={formData.body}
              onChange={onChange}
              disabled={status === "submitting"}
              aria-invalid={!!getFieldError("body", fieldErrors)}
              className={`w-full rounded-lg border px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:text-zinc-50 dark:placeholder-zinc-500 ${
                getFieldError("body", fieldErrors)
                  ? "border-red-400 focus:ring-red-400"
                  : "border-zinc-300 dark:border-zinc-600"
              } bg-white dark:bg-zinc-800`}
              placeholder="The search functionality is not working for movies with special characters."
            />
            {getFieldError("body", fieldErrors) && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {getFieldError("body", fieldErrors)}
              </p>
            )}
          </div>

          {/* Contact */}
          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-200"
              htmlFor="contact"
            >
              Contact <span className="text-red-500">*</span>
            </label>
            <input
              id="contact"
              name="contact"
              type="text"
              required
              value={formData.contact}
              onChange={onChange}
              disabled={status === "submitting"}
              aria-invalid={!!getFieldError("contact", fieldErrors)}
              className={`w-full rounded-lg border px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:text-zinc-50 dark:placeholder-zinc-500 ${
                getFieldError("contact", fieldErrors)
                  ? "border-red-400 focus:ring-red-400"
                  : "border-zinc-300 dark:border-zinc-600"
              } bg-white dark:bg-zinc-800`}
              placeholder="alice@example.com"
            />
            {getFieldError("contact", fieldErrors) && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {getFieldError("contact", fieldErrors)}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
          >
            {status === "submitting" ? "Submitting..." : "Submit report"}
          </button>
        </form>
      </div>
    </main>
  );
}
