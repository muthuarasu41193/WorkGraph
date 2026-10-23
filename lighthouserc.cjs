const base = (process.env.LHCI_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "")

/**
 * Lab budget for a simulated mid-range phone on slow 4G.
 * INP is a field metric. Lighthouse's interaction-to-next-paint is the lab stand-in.
 * This file is not run in the default verify workflow. See .github/workflows/lighthouse.yml.
 */
module.exports = {
  ci: {
    collect: {
      url: [`${base}/`, `${base}/jobs`, `${base}/jobs/example`],
      numberOfRuns: 1,
      settings: {
        formFactor: "mobile",
        screenEmulation: {
          mobile: true,
          width: 412,
          height: 823,
          deviceScaleFactor: 1.75,
        },
        throttlingMethod: "simulate",
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4,
        },
      },
    },
    assert: {
      assertions: {
        "categories:performance": "off",
        "largest-contentful-paint": ["error", { maxNumericValue: 2000 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.05 }],
        "interaction-to-next-paint": ["error", { maxNumericValue: 200 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci",
    },
  },
}
