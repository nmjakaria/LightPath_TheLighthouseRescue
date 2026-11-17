"use client";

/* Route-level error boundary injected into the root layout. It keeps navigation available when a
 * screen fails instead of leaving a blank page. */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Panel } from "@/components/ui";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-abyss px-6 text-soft-white">
      <Panel eyebrow="Something went wrong" title="The beam went dark">
        <p className="text-mist">The screen could not load. You can try again or return to the menu.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button variant="secondary" onClick={() => router.push("/")}>
            Main menu
          </Button>
        </div>
      </Panel>
    </main>
  );
}
