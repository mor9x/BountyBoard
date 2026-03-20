import type { GraphQLRequest, GraphQLResponse } from "../types/graphql";

export type GraphQLClientConfig = {
  endpoint: string;
  headers?: HeadersInit;
};

export async function requestGraphQL<TData, TVariables extends Record<string, unknown> = Record<string, never>>(
  config: GraphQLClientConfig,
  request: GraphQLRequest<TVariables>
): Promise<TData> {
  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...config.headers
    },
    body: JSON.stringify({
      query: request.query,
      variables: request.variables
    })
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as GraphQLResponse<TData>;

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join("; "));
  }

  if (!payload.data) {
    throw new Error("GraphQL response did not include data");
  }

  return payload.data;
}
