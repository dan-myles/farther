import { describe, expect, it } from "vite-plus/test";

import { fartherSidebarMaximumWidth, fartherSidebarMinimumWidth } from "./sidebarWidth";

describe("farther sidebar width limits", () => {
  it("never goes below Paper's 320px", () => {
    expect(fartherSidebarMinimumWidth(208)).toBe(320);
    expect(fartherSidebarMinimumWidth(340)).toBe(340);
  });

  it("caps growth at 440px on wide windows", () => {
    expect(fartherSidebarMaximumWidth(1800, 320)).toBe(440);
  });

  it("follows upstream's room-for-the-chat limit on narrow windows, but not below the minimum", () => {
    expect(fartherSidebarMaximumWidth(380, 320)).toBe(380);
    expect(fartherSidebarMaximumWidth(200, 320)).toBe(320);
  });
});
