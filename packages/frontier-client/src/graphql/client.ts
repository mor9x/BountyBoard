import type { GraphQLRequest, GraphQLResponse } from "../types/graphql";

export type GraphQLClientConfig = {
  endpoint: string;
  headers?: HeadersInit;
  fetch?: typeof fetch;
  retryAttempts?: number;
  retryDelayMs?: number;
  proxy?: string;
};

function isRetryableGraphQLError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const code = "code" in error ? String(error.code) : "";
  const status = "status" in error ? Number(error.status) : NaN;
  return (
    code === "ECONNRESET" ||
    code === "ETIMEDOUT" ||
    code === "UND_ERR_CONNECT_TIMEOUT" ||
    status === 408 ||
    status === 425 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveProxy(endpoint: string, configuredProxy?: string) {
  if (configuredProxy) {
    return configuredProxy;
  }

  const runtimeEnv =
    typeof process !== "undefined" && process.env
      ? process.env
      : undefined;
  const upperHttp = runtimeEnv?.HTTP_PROXY;
  const upperHttps = runtimeEnv?.HTTPS_PROXY;
  const lowerHttp = runtimeEnv?.http_proxy;
  const lowerHttps = runtimeEnv?.https_proxy;

  if (endpoint.startsWith("https://")) {
    return upperHttps ?? lowerHttps ?? upperHttp ?? lowerHttp ?? undefined;
  }

  return upperHttp ?? lowerHttp ?? upperHttps ?? lowerHttps ?? undefined;
}

export async function requestGraphQL<TData, TVariables extends Record<string, unknown> = Record<string, never>>(
  config: GraphQLClientConfig,
  request: GraphQLRequest<TVariables>
): Promise<TData> {
  const fetchImpl = config.fetch ?? fetch;
  const retryAttempts = config.retryAttempts ?? 3;
  const retryDelayMs = config.retryDelayMs ?? 500;
  const proxy = resolveProxy(config.endpoint, config.proxy);

  let lastError: unknown = null;

  for (let attempt = 0; attempt < retryAttempts; attempt += 1) {
    try {
      const response = await fetchImpl(config.endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...config.headers
        },
        body: JSON.stringify({
          query: request.query,
          variables: request.variables
        }),
        ...(proxy ? { proxy } : {})
      } as RequestInit);

      if (!response.ok) {
        const error = new Error(`GraphQL request failed with status ${response.status}`) as Error & { status?: number };
        error.status = response.status;
        throw error;
      }

      const payload = (await response.json()) as GraphQLResponse<TData>;

      if (payload.errors?.length) {
        throw new Error(payload.errors.map((error) => error.message).join("; "));
      }

      if (!payload.data) {
        throw new Error("GraphQL response did not include data");
      }

      return payload.data;
    } catch (error) {
      lastError = error;

      if (!isRetryableGraphQLError(error) || attempt === retryAttempts - 1) {
        break;
      }

      await sleep(retryDelayMs * (attempt + 1));
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
