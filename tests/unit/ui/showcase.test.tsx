import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ToastProvider } from "@/components/ui";
import { isShowcaseEnabled } from "@/app/dev/ui/showcaseFlag";
import { UiShowcase } from "@/app/dev/ui/UiShowcase";

describe("dev UI showcase guard", () => {
  it("enables the page only when the flag is set outside production", () => {
    expect(isShowcaseEnabled(true, "development")).toBe(true);
    expect(isShowcaseEnabled(true, "production")).toBe(false);
    expect(isShowcaseEnabled(false, "development")).toBe(false);
    expect(isShowcaseEnabled(false, undefined)).toBe(false);
  });
});

describe("dev UI showcase content", () => {
  const html = renderToStaticMarkup(
    <ToastProvider>
      <UiShowcase />
    </ToastProvider>,
  );

  it.each([
    "Primary",
    "Secondary",
    "Ghost",
    "Danger",
    "With icon",
    "Loading",
    'aria-label="Settings"',
    "Interactive",
    "With footer",
    "HUD",
    'aria-label="0 of 3 stars"',
    'aria-label="No charge"',
    'aria-label="Charging"',
    'aria-label="Success"',
    'aria-label="Warning"',
    'aria-label="Full danger"',
    "<kbd",
    'role="tooltip"',
    "Master volume",
    '<select',
    'role="switch"',
    "Interactive stars",
    "Info toast",
    "Success toast",
    "Warning toast",
    "Danger toast",
    "Open modal",
  ])("renders %s", (needle) => {
    expect(html).toContain(needle);
  });
});
