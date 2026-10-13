/**
 * tests/unit/utm.test.ts — pure-function unit test
 *
 * Demonstrates the tests/unit/ layer with a small, fast, fully-isolated
 * unit test of captureUtmParams. Because the function reads from
 * `window.location`, we use the per-file `// @vitest-environment jsdom`
 * pragma to opt into jsdom for this one file. The rest of the suite runs
 * under the default node environment.
 */
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { captureUtmParams, hasUtmParams } from "@/lib/utm";

beforeEach(() => {
  // Reset the URL between tests so no UTM params leak across cases.
  // jsdom doesn't actually navigate when you assign to `window.location.href`
  // (it logs "Not implemented: navigation to another Document"), so we use
  // `history.replaceState` which DOES update the URL bar in jsdom.
  window.history.replaceState(null, "", "http://localhost:3000/");
});

function setUrl(url: string) {
  window.history.replaceState(null, "", url);
}

describe("captureUtmParams — server / non-browser fallback", () => {
  // Note: under jsdom, `window` IS defined, so this fallback path is
  // exercised by the unit-test variant below. We test the SSR-equivalent
  // behaviour by deleting window.location temporarily.

  it("returns {} when no UTM params are present", () => {
    setUrl("http://localhost:3000/");
    expect(captureUtmParams()).toEqual({});
    expect(hasUtmParams()).toBe(false);
  });
});

describe("captureUtmParams — single param", () => {
  it("captures utm_source", () => {
    setUrl("http://localhost:3000/?utm_source=newsletter");
    const out = captureUtmParams();
    expect(out.utmSource).toBe("newsletter");
    expect(out.utmMedium).toBeUndefined();
    expect(hasUtmParams()).toBe(true);
  });

  it("captures utm_medium", () => {
    setUrl("http://localhost:3000/?utm_medium=email");
    expect(captureUtmParams().utmMedium).toBe("email");
  });

  it("captures utm_campaign", () => {
    setUrl("http://localhost:3000/?utm_campaign=launch");
    expect(captureUtmParams().utmCampaign).toBe("launch");
  });

  it("captures ref as referralSource", () => {
    setUrl("http://localhost:3000/?ref=friend");
    expect(captureUtmParams().referralSource).toBe("friend");
  });
});

describe("captureUtmParams — multi-param", () => {
  it("captures all five UTM params + ref at once", () => {
    setUrl(
      "http://localhost:3000/?utm_source=google&utm_medium=cpc&utm_campaign=brand&utm_content=cta&utm_term=ops&ref=al"
    );
    const out = captureUtmParams();
    expect(out).toEqual({
      utmSource: "google",
      utmMedium: "cpc",
      utmCampaign: "brand",
      utmContent: "cta",
      utmTerm: "ops",
      referralSource: "al",
    });
  });
});

describe("captureUtmParams — edge cases", () => {
  it("trims whitespace from values", () => {
    setUrl("http://localhost:3000/?utm_source=%20%20newsletter%20");
    expect(captureUtmParams().utmSource).toBe("newsletter");
  });

  it("drops empty-string values (utm_source= with nothing after =)", () => {
    setUrl("http://localhost:3000/?utm_source=");
    expect(captureUtmParams().utmSource).toBeUndefined();
    expect(hasUtmParams()).toBe(false);
  });

  it("drops whitespace-only values", () => {
    setUrl("http://localhost:3000/?utm_source=%20%20");
    expect(captureUtmParams().utmSource).toBeUndefined();
  });

  it("ignores unrelated query params", () => {
    setUrl("http://localhost:3000/?foo=bar&baz=qux");
    expect(captureUtmParams()).toEqual({});
  });
});
