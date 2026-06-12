import { describe, expect, it } from "vitest";

import {
  MAX_SOURCE_IMAGE_BYTES,
  validateImageFile,
} from "@/lib/media";

describe("image validation", () => {
  it("accepts supported image formats", () => {
    expect(validateImageFile({ type: "image/jpeg", size: 1024 })).toBeNull();
    expect(validateImageFile({ type: "image/webp", size: 1024 })).toBeNull();
  });

  it("rejects unsupported and oversized files", () => {
    expect(validateImageFile({ type: "image/svg+xml", size: 1024 })).toContain(
      "仅支持",
    );
    expect(
      validateImageFile({
        type: "image/png",
        size: MAX_SOURCE_IMAGE_BYTES + 1,
      }),
    ).toContain("15MB");
  });
});
