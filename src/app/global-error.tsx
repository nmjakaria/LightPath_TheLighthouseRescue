"use client";

/* Last-resort boundary for failures in the root layout itself. It must render its own html/body. */
import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-abyss text-soft-white">
        <main className="flex min-h-screen items-center justify-center px-6 text-center">
          <div className="space-y-4 rounded-card border border-navy-line bg-deep-navy p-8">
            <h1 className="font-display text-3xl font-semibold text-beam-core">LightPath could not start</h1>
            <p className="text-mist">Reload the page to try again.</p>
            <button
              type="button"
              onClick={reset}
              className="rounded-button border border-cyan-beam bg-cyan-beam px-4 py-2 font-display font-semibold text-abyss"
            >
              Reload
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
