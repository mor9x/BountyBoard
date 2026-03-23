export const getWalletCharactersDocument = `
  query GetWalletCharacters($owner: SuiAddress!, $characterPlayerProfileType: String!, $first: Int) {
    address(address: $owner) {
      objects(
        first: $first
        filter: {
          type: $characterPlayerProfileType
        }
      ) {
        nodes {
          contents {
            extract(path: "character_id") {
              asAddress {
                asObject {
                  asMoveObject {
                    contents {
                      type {
                        repr
                      }
                      json
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;
