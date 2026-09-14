import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createRedirectFileContents,
  generateNetlifyRedirects,
} from "../scripts/generate-netlify-redirects.mjs";

const temporaryDirectories: string[] = [];

async function temporaryRedirectPath() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "asili-netlify-redirects-"));
  temporaryDirectories.push(directory);
  return path.join(directory, "dist", "_redirects");
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe("Netlify redirect generation", () => {
  it.each([
    [
      "production",
      "https://asili-api-production.up.railway.app",
      "/api/*  https://asili-api-production.up.railway.app/api/:splat  200!\n",
    ],
    [
      "staging",
      "https://asili-api-staging.up.railway.app",
      "/api/*  https://asili-api-staging.up.railway.app/api/:splat  200!\n",
    ],
  ])("writes the %s target", async (_context, target, expected) => {
    const outputPath = await temporaryRedirectPath();
    const logger = { ...console, log: vi.fn() };

    const result = await generateNetlifyRedirects({
      env: { NETLIFY: "true", API_PROXY_TARGET: target },
      outputPath,
      logger,
    });

    expect(result.written).toBe(true);
    await expect(readFile(outputPath, "utf8")).resolves.toBe(expected);
  });

  it("normalizes trailing slashes", () => {
    expect(createRedirectFileContents("https://api.example.com///")).toBe(
      "/api/*  https://api.example.com/api/:splat  200!\n",
    );
  });

  it("fails clearly when a Netlify build has no target", async () => {
    await expect(
      generateNetlifyRedirects({
        env: { NETLIFY: "true" },
        outputPath: await temporaryRedirectPath(),
        logger: { ...console, log: vi.fn() },
      }),
    ).rejects.toThrow("API_PROXY_TARGET is required during Netlify builds");
  });

  it("skips an ordinary local build when no target is configured", async () => {
    const logger = { ...console, log: vi.fn() };
    const result = await generateNetlifyRedirects({
      env: {},
      outputPath: await temporaryRedirectPath(),
      logger,
    });

    expect(result.written).toBe(false);
    expect(logger.log).toHaveBeenCalledWith(expect.stringContaining("skipped"));
  });
});
