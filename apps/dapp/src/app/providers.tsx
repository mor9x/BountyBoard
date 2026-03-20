import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, type DataRouter } from "react-router-dom";
import { queryClient } from "../lib/query-client";

type AppProvidersProps = {
  router: DataRouter;
};

export function AppProviders({ router }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
