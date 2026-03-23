import { queryKillmailEvents, type GraphQLClientConfig, type KillmailEvent } from "@bounty-board/frontier-client";
import type { OracleConfig } from "../types";

export type KillmailEdge = {
  cursor: string;
  event: KillmailEvent;
};

export type KillmailPage = {
  edges: KillmailEdge[];
  hasNextPage: boolean;
  endCursor: string | null;
};

export async function fetchKillmailPage(
  config: OracleConfig,
  clientConfig: GraphQLClientConfig,
  cursor: string | null
): Promise<KillmailPage> {
  const page = await queryKillmailEvents(clientConfig, {
    packageId: config.worldPackageId,
    first: config.graphQLPageSize,
    after: cursor
  });

  return {
    edges: page.edges.map((edge) => ({
      cursor: edge.cursor,
      event: edge.node
    })),
    hasNextPage: page.pageInfo.hasNextPage,
    endCursor: page.pageInfo.endCursor
  };
}
