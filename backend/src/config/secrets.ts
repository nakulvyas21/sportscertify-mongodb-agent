const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID || "your-gcp-project";

const isTruthy = (v: string | undefined): boolean =>
  ["true", "1", "yes"].includes((v ?? "").toLowerCase());

export const IS_PRODUCTION = isTruthy(process.env.IS_PRODUCTION);
export const IS_BUILD_PHASE = isTruthy(process.env.IS_BUILD_PHASE);

const _cache = new Map<string, string>();

export async function getSecret(
  secretName: string,
  opts: { projectId?: string; version?: string } = {}
): Promise<string | null> {
  if (IS_BUILD_PHASE) return null;

  const projectId = opts.projectId ?? GCP_PROJECT_ID;
  const version = opts.version ?? "latest";
  const cacheKey = `${projectId}/${secretName}/${version}`;
  const cached = _cache.get(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const { SecretManagerServiceClient } = await import(
      "@google-cloud/secret-manager"
    );
    const client = new SecretManagerServiceClient();
    const name = `projects/${projectId}/secrets/${secretName}/versions/${version}`;
    const [response] = await client.accessSecretVersion({ name });
    const value = response.payload?.data?.toString();
    if (value != null) {
      _cache.set(cacheKey, value);
      return value;
    }
    return null;
  } catch (err) {
    console.warn(
      `⚠️  Could not fetch secret '${secretName}' from Secret Manager:`,
      (err as Error).message
    );
    return null;
  }
}

export async function resolveSecret(
  secretName: string,
  envVar: string,
  fallback?: string
): Promise<string | undefined> {
  if (IS_PRODUCTION) {
    const fromSm = await getSecret(secretName);
    if (fromSm != null) return fromSm;
  }
  return process.env[envVar] ?? fallback;
}
