import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

export function normalizeApiProxyTarget(value) {
  const target = value?.trim();

  if (!target) {
    throw new Error("API_PROXY_TARGET must not be empty.");
  }

  let parsed;
  try {
    parsed = new URL(target);
  } catch {
    throw new Error("API_PROXY_TARGET must be a valid absolute URL.");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("API_PROXY_TARGET must use http or https.");
  }

  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error("API_PROXY_TARGET must not contain credentials, a query, or a hash.");
  }

  return target.replace(/\/+$/, "");
}

export function createRedirectFileContents(apiProxyTarget) {
  const normalizedTarget = normalizeApiProxyTarget(apiProxyTarget);
  return `/api/*  ${normalizedTarget}/api/:splat  200!\n`;
}

export async function generateNetlifyRedirects({
  env = process.env,
  outputPath = path.resolve("dist", "_redirects"),
  logger = console,
} = {}) {
  const apiProxyTarget = env.API_PROXY_TARGET?.trim();

  if (!apiProxyTarget) {
    if (env.NETLIFY === "true") {
      throw new Error(
        "API_PROXY_TARGET is required during Netlify builds. Configure it for this deploy context.",
      );
    }

    logger.log(
      "API_PROXY_TARGET is not set; skipped Netlify API proxy generation for this local build.",
    );
    return { written: false, outputPath };
  }

  const contents = createRedirectFileContents(apiProxyTarget);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, contents, "utf8");
  logger.log(`Generated Netlify API proxy redirect at ${outputPath}.`);
  return { written: true, outputPath, contents };
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : undefined;

if (invokedPath === import.meta.url) {
  generateNetlifyRedirects().catch((error) => {
    console.error(`Netlify redirect generation failed: ${error.message}`);
    process.exitCode = 1;
  });
}
