import { ToastProvider } from "@/components/ui";
import { features } from "@/config/features";
import { UiShowcase } from "./UiShowcase";
import { isShowcaseEnabled } from "./showcaseFlag";

const showcaseEnabled = isShowcaseEnabled(features.devUiPage, process.env.NODE_ENV);

export const metadata = { title: "UI primitives — LightPath" };

export default function DevUiPage() {
  if (!showcaseEnabled) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-abyss px-6 text-center text-soft-white">
        <p className="text-base text-mist">
          The UI showcase is disabled. Set <code className="font-mono text-cyan-beam">NEXT_PUBLIC_DEV_UI_PAGE=true</code> in development.
        </p>
      </main>
    );
  }

  return (
    <ToastProvider>
      <main className="min-h-screen bg-abyss text-soft-white">
        <UiShowcase />
      </main>
    </ToastProvider>
  );
}
