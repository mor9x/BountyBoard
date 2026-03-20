import { generatedIds } from "./generated";

const { bountyBoardPackageId } = generatedIds;
const worldPackageId = "0xd12a70c74c1e759445d6f209b01d43d860e97fcf2ef72ccbbd00afd828043f75";

export const utopiaEnvironment = {
  network: "testnet",
  graphqlUrl: "https://sui-testnet.mystenlabs.com/graphql",
  worldApiUrl: "https://world-api-utopia.uat.pub.evefrontier.com",
  worldPackageId,
  bountyBoardPackageId
} as const;
