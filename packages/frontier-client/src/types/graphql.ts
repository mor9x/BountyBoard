export type PageInfo = {
  hasNextPage: boolean;
  endCursor: string | null;
};

export type ConnectionPage<T> = {
  nodes: T[];
  pageInfo: PageInfo;
};

export type GraphQLRequest<TVariables extends Record<string, unknown>> = {
  query: string;
  variables: TVariables;
};

export type GraphQLError = {
  message: string;
};

export type GraphQLResponse<TData> = {
  data?: TData;
  errors?: GraphQLError[];
};
