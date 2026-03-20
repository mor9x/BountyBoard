import { queryKillmailEvents } from "./queries/killmail";
import { utopiaEnvironment } from "./constants";
import type { GraphQLClientConfig } from "./graphql/client";
import type { QueryKillmailEventsArgs } from "./queries/killmail";
import type { ConnectionPage } from "./types/graphql";
import type { KillmailEvent } from "./types/killmail";

export type FrontierClient = {
  environment: typeof utopiaEnvironment;
  queryKillmailEvents: (args: QueryKillmailEventsArgs) => Promise<ConnectionPage<KillmailEvent>>;
};

export function createFrontierClient(config: Partial<GraphQLClientConfig> = {}): FrontierClient {
  const graphQLConfig: GraphQLClientConfig = {
    endpoint: config.endpoint ?? utopiaEnvironment.graphqlUrl,
    headers: config.headers
  };

  return {
    environment: utopiaEnvironment,
    queryKillmailEvents: (args) => queryKillmailEvents(graphQLConfig, args)
  };
}

export { utopiaEnvironment } from "./constants";
export { getKillmailCreatedEventType, queryKillmailEvents } from "./queries/killmail";
export type { KillmailEvent } from "./types/killmail";
export type { ConnectionPage, PageInfo } from "./types/graphql";
