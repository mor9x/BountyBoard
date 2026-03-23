export type CharacterMetadata = {
  name: string | null;
  description: string | null;
  url: string | null;
};

export type WalletCharacter = {
  objectId: string;
  worldPackageId: string;
  itemId: number;
  tenant: string;
  tribeId: number | null;
  characterAddress: string | null;
  ownerCapId: string | null;
  metadata: CharacterMetadata;
};

export type MirrorCharacterLookup = WalletCharacter & {
  exists: true;
};
