import { getWalletCharactersDocument } from "../graphql/documents/wallet-characters";
import { requestGraphQL, type GraphQLClientConfig } from "../graphql/client";
import type { WalletCharacter } from "../types/character";
import { toNullableNumber, toNullableString } from "./helpers";

type WalletCharactersResponse = {
  address?: {
    objects?: {
      nodes?: Array<{
        contents?: {
          extract?: {
            asAddress?: {
              asObject?: {
                asMoveObject?: {
                  contents?: {
                    type?: { repr?: string | null } | null;
                    json?: Record<string, unknown> | null;
                  } | null;
                } | null;
              } | null;
            } | null;
          } | null;
        } | null;
      } | null> | null;
    } | null;
  } | null;
};

export type QueryWalletCharactersArgs = {
  owner: string;
  worldPackageId: string;
  first?: number;
};

function parseWalletCharacter(json: Record<string, unknown> | null, worldPackageId: string): WalletCharacter | null {
  if (!json) {
    return null;
  }

  const key = json.key && typeof json.key === "object" ? (json.key as Record<string, unknown>) : null;
  const metadata =
    json.metadata && typeof json.metadata === "object" ? (json.metadata as Record<string, unknown>) : null;
  const itemId = toNullableNumber(key?.item_id ?? null);
  const tenant = toNullableString(key?.tenant ?? null);
  const objectId = toNullableString(json.id ?? null);

  if (!objectId || itemId === null || !tenant) {
    return null;
  }

  return {
    objectId,
    worldPackageId,
    itemId,
    tenant,
    tribeId: toNullableNumber(json.tribe_id ?? null),
    characterAddress: toNullableString(json.character_address ?? null),
    ownerCapId: toNullableString(json.owner_cap_id ?? null),
    metadata: {
      name: toNullableString(metadata?.name ?? null),
      description: toNullableString(metadata?.description ?? null),
      url: toNullableString(metadata?.url ?? null)
    }
  };
}

export async function queryWalletCharacters(
  config: GraphQLClientConfig,
  args: QueryWalletCharactersArgs
): Promise<WalletCharacter[]> {
  const data = await requestGraphQL<
    WalletCharactersResponse,
    {
      owner: string;
      characterPlayerProfileType: string;
      first: number;
    }
  >(config, {
    query: getWalletCharactersDocument,
    variables: {
      owner: args.owner,
      characterPlayerProfileType: `${args.worldPackageId}::character::PlayerProfile`,
      first: args.first ?? 25
    }
  });

  const seen = new Set<string>();
  const characters: WalletCharacter[] = [];

  for (const node of data.address?.objects?.nodes ?? []) {
    const json = node?.contents?.extract?.asAddress?.asObject?.asMoveObject?.contents?.json ?? null;
    const parsed = parseWalletCharacter(json, args.worldPackageId);
    if (!parsed || seen.has(parsed.objectId)) {
      continue;
    }
    seen.add(parsed.objectId);
    characters.push(parsed);
  }

  return characters;
}
