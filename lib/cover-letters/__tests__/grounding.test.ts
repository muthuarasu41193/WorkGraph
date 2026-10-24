import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  extractNumbers,
  extractOrganisationNames,
  findUngroundedClaims,
  formatClaimWarning,
} from "../grounding";

const RESUME = "Software engineer at Acme Corp from 2019 to 2022. Increased revenue by 12%.";
const JOB = "We need an engineer who has shipped production APIs. Team of 8.";

describe("cover letter grounding", () => {
  it("flags an invented 45% when 45 is not in the resume or job description", () => {
    const letter = "At Acme Corp I increased revenue by 45% and led the billing migration.";
    const flags = findUngroundedClaims(letter, {
      resumeText: RESUME,
      jobDescription: JOB,
      roleContext: "Acme Corp\nSoftware Engineer",
    });
    const numbers = flags.filter((flag) => flag.kind === "number");
    assert.ok(
      numbers.some((flag) => flag.claim.includes("45")),
      `expected 45 to be flagged, got ${JSON.stringify(flags)}`,
    );
    assert.equal(
      numbers.some((flag) => flag.claim.includes("12")),
      false,
    );
  });

  it("does not flag numbers that are present in the resume", () => {
    const letter = "At Acme Corp I increased revenue by 12% between 2019 and 2022.";
    const flags = findUngroundedClaims(letter, {
      resumeText: RESUME,
      jobDescription: "Engineer role.",
    });
    assert.deepEqual(
      flags.filter((flag) => flag.kind === "number"),
      [],
    );
  });

  it("does not flag a number that appears only in the job description", () => {
    const letter = "I am applying to join a team of 8 engineers at Acme Corp.";
    const flags = findUngroundedClaims(letter, {
      resumeText: "Engineer at Acme Corp.",
      jobDescription: JOB,
      roleContext: "Acme Corp",
    });
    assert.equal(
      flags.some((flag) => flag.kind === "number" && flag.claim.includes("8")),
      false,
    );
  });

  it("does not treat a longer number as containing a shorter one", () => {
    const flags = findUngroundedClaims("I grew pipeline by 45%.", {
      resumeText: "Supported a team of 450 people.",
      jobDescription: "Growth role.",
    });
    assert.ok(flags.some((flag) => flag.kind === "number" && flag.claim.includes("45")));
  });

  it("flags an organisation that appears in neither the resume nor the job description", () => {
    const flags = findUngroundedClaims("I previously led design at Initech Labs.", {
      resumeText: RESUME,
      jobDescription: JOB,
      roleContext: "Acme Corp\nSoftware Engineer",
    });
    assert.ok(
      flags.some((flag) => flag.kind === "organisation" && flag.claim === "Initech Labs"),
      `expected Initech Labs, got ${JSON.stringify(flags)}`,
    );
  });

  it("does not flag the company the candidate named for this role", () => {
    const flags = findUngroundedClaims("I am applying to Acme Corp.", {
      resumeText: "Engineer with API experience.",
      jobDescription: "Backend role.",
      roleContext: "Acme Corp\nBackend Engineer",
    });
    assert.equal(
      flags.some((flag) => flag.kind === "organisation"),
      false,
    );
  });

  it("formats a visible warning list", () => {
    const flags = findUngroundedClaims("I increased revenue by 45% at Initech Labs.", {
      resumeText: "Engineer.",
      jobDescription: "Engineer role.",
    });
    const warning = formatClaimWarning(flags);
    assert.ok(warning);
    assert.match(warning, /^Check these claims before sending: /);
    assert.match(warning, /45%/);
    assert.match(warning, /Initech Labs/);
  });

  it("extracts percentages, currency, and capitalised multi-word names", () => {
    assert.deepEqual(extractNumbers("Saved $1,200 and grew 45%."), ["$1,200", "45%"]);
    assert.deepEqual(extractOrganisationNames("I worked at Initech Labs and Acme Corp."), [
      "Initech Labs",
      "Acme Corp",
    ]);
  });
});
