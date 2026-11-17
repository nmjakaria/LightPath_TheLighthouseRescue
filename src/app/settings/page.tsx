import { BackButton } from "@/components/game/BackButton";
import { ScreenShell } from "@/components/game/ScreenShell";
import { SettingsForm } from "@/components/settings/SettingsForm";

export const metadata = { title: "Settings — LightPath" };

export default function SettingsPage() {
  return (
    <ScreenShell>
      <div className="mb-6 flex justify-end">
        <BackButton />
      </div>
      <SettingsForm />
    </ScreenShell>
  );
}
