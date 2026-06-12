import { describe, expect, it } from "vitest";

import {
  defaultLocationSettings,
  locationSafetyCopy,
  publicLocationLabel,
} from "@/lib/privacy";

describe("location privacy", () => {
  it("never exposes exact coordinates in its public label", () => {
    expect(publicLocationLabel(defaultLocationSettings)).toBe("望京 · 3km内");
  });

  it("explains pure online mode", () => {
    const settings = { ...defaultLocationSettings, permission: "off" as const };
    expect(publicLocationLabel(settings)).toBe("纯线上模式");
    expect(locationSafetyCopy(settings)).toContain("不会使用");
  });
});
