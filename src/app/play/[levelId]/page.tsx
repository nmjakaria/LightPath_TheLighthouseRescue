import { Suspense } from "react";
import { PlayRouteGate } from "@/components/game/PlayRouteGate";

export const metadata = { title: "Play — LightPath" };

async function PlayPageContent({ params }: { params: Promise<{ levelId: string }> }) {
  const { levelId } = await params;
  return <PlayRouteGate levelId={levelId} />;
}

function PlayFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-abyss px-6 text-center text-soft-white">
      <p role="status" aria-live="polite" className="font-display text-2xl text-beam-core">
        Lighting the lamp…
      </p>
    </main>
  );
}

export default function PlayPage({ params }: { params: Promise<{ levelId: string }> }) {
  return (
    <Suspense fallback={<PlayFallback />}>
      <PlayPageContent params={params} />
    </Suspense>
  );
}
