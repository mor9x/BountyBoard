import { dAppKit } from "@evefrontier/dapp-kit";
import { DAppKitProvider } from "@mysten/dapp-kit-react";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, type DataRouter } from "react-router-dom";
import { queryClient } from "../lib/query-client";

type AppProvidersProps = {
  router: DataRouter;
};

export function AppProviders({ router }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <DAppKitProvider dAppKit={dAppKit}>
        <RouterProvider router={router} />
      </DAppKitProvider>
    </QueryClientProvider>
  );
}
