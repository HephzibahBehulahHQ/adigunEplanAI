import { test } from "node:test";
import assert from "node:assert/strict";
import {
  loadProductTemplate,
  productTemplateIssues,
} from "../../scripts/check-product-template.mjs";

test("product adapter satisfies canonical brand, authority and capability gates", () => {
  assert.deepEqual(productTemplateIssues(loadProductTemplate()), []);
});
for (const [label, change] of [
  [
    "unreviewed authority revision",
    (b) => {
      b.config.authorityPins.designSystem = "0".repeat(40);
    },
  ],
  [
    "foreign corporate link",
    (b) => {
      b.config.links.corporateWebsite = "https://example.com/";
    },
  ],
  [
    "foreign specification binding",
    (b) => {
      b.config.specification.masterPlan = "other.md";
    },
  ],
  [
    "joint master-plan drift",
    (b) => {
      const text = b.master.trimEnd() + "\nChanged acceptance";
      b.master = text;
      b.ownerMaster = text;
    },
  ],

  [
    "foreign product identity",
    (b) => {
      b.config.product.name = "AdigunSPs";
    },
  ],
  [
    "foreign destination",
    (b) => {
      b.config.product.repository = "HephzibahBehulahHQ/hb-elektroniker";
    },
  ],
  [
    "brand accent drift",
    (b) => {
      b.brands.elektroniker.accent = "#A78BFA";
    },
  ],
  [
    "joint token and CSS drift",
    (b) => {
      b.corporate.colors.gold = "#123456";
      b.css = b.css.replaceAll("#d4af37", "#123456");
    },
  ],
  [
    "competing logos",
    (b) => {
      b.config.branding.header.additionalBrandLogos = true;
    },
  ],
  [
    "unapproved logo bytes",
    (b) => {
      b.logo = "0".repeat(64);
    },
  ],
  [
    "changed interface",
    (b) => {
      b.ownerTarget = "0".repeat(64);
    },
  ],
  [
    "diverged specification",
    (b) => {
      b.ownerMaster += "\nChanged acceptance";
    },
  ],
  [
    "missing AI authority",
    (b) => {
      delete b.config.references.artificialIntelligenceRepository;
    },
  ],
  [
    "invented hosted AI",
    (b) => {
      b.bot.hostedAI = true;
    },
  ],
  [
    "invented completion",
    (b) => {
      b.config.acceptance.fullSpecificationComplete = true;
    },
  ],
  [
    "fabricated example count",
    (b) => {
      b.config.acceptance.sampleProjects.validatedCount = 500;
    },
  ],
  [
    "inherited trial restriction",
    (b) => {
      b.config.features.accounts.guestAccess.trialMinutes = 10;
    },
  ],
])
  test(`template enforcement rejects ${label}`, () => {
    const bundle = loadProductTemplate();
    change(bundle);
    assert.ok(productTemplateIssues(bundle).length > 0);
  });
