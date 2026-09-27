import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { authPath, safeDashboardNext } from "@/lib/auth-next";

describe("safeDashboardNext", () => {
  it("keeps dashboard destinations and their plan intent", () => {
    assert.equal(safeDashboardNext("/dashboard"), "/dashboard");
    assert.equal(
      safeDashboardNext("/dashboard/settings/billing?plan=pro"),
      "/dashboard/settings/billing?plan=pro",
    );
  });

  it("rejects external and unauthenticated destinations", () => {
    assert.equal(safeDashboardNext("https://example.com"), "/dashboard");
    assert.equal(safeDashboardNext("//example.com/dashboard"), "/dashboard");
    assert.equal(safeDashboardNext("javascript:alert(1)"), "/dashboard");
    assert.equal(safeDashboardNext("/login"), "/dashboard");
  });
});

describe("authPath", () => {
  it("only adds a query parameter when a non-default destination is needed", () => {
    assert.equal(authPath("/login", "/dashboard"), "/login");
    assert.equal(
      authPath("/register", "/dashboard/settings/billing?plan=premium"),
      "/register?next=%2Fdashboard%2Fsettings%2Fbilling%3Fplan%3Dpremium",
    );
  });
});

