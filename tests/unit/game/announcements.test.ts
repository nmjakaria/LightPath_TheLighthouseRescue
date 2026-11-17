import { describe, expect, it } from "vitest";
import { announcementFrom } from "@/game/announcements";

type AnnouncementInput = Parameters<typeof announcementFrom>[0];

function snapshot(partial: Partial<AnnouncementInput> = {}): AnnouncementInput {
  const base: AnnouncementInput = {
    status: "playing",
    paused: false,
    feedback: null,
    litTargets: 0,
    requiredTargets: 1,
    litSwitches: 0,
    openGates: 0,
    selectedId: null,
    moves: 0,
    timeSec: 0,
  };
  return { ...base, ...partial };
}

describe("screen-reader announcements (NFR-017)", () => {
  it("announces completion with the recorded time and move count", () => {
    expect(announcementFrom(snapshot({ status: "complete", timeSec: 42.5, moves: 7 }))).toBe(
      "Level complete in 00:42 with 7 moves.",
    );
  });

  it("announces pause and locked-component feedback before routine progress", () => {
    expect(announcementFrom(snapshot({ paused: true, feedback: "locked" }))).toBe("Game paused.");
    expect(announcementFrom(snapshot({ feedback: "locked" }))).toBe("That component is locked.");
    expect(announcementFrom(snapshot({ feedback: "outsideRange" }))).toBe(
      "The rock stays within its rail.",
    );
  });

  it("reports targets, powered switches, open gates and the selection", () => {
    expect(announcementFrom(snapshot())).toBe("Target 0 of 1 lit.");
    expect(
      announcementFrom(
        snapshot({
          litTargets: 1,
          requiredTargets: 2,
          litSwitches: 1,
          openGates: 1,
          selectedId: "M2",
        }),
      ),
    ).toBe("Target 1 of 2 lit. 1 switch powered. 1 gate open. Selected M2.");
  });

  it("does not include the running timer so assistive technology is not spammed", () => {
    const first = announcementFrom(snapshot({ moves: 1, timeSec: 1 }));
    const later = announcementFrom(snapshot({ moves: 1, timeSec: 9.9 }));
    expect(first).toBe(later);
    expect(first).not.toContain("00:0");
  });
});
