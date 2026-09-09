export type RegexGateway = ReturnType<typeof createRegexGateway>;

export function createRegexGateway() {
  return {
    listGlobalRegexes() {
      return getTavernRegexes({ type: 'global' });
    },
    updateGlobalRegexes(updater: (regexes: TavernRegex[]) => TavernRegex[]) {
      return updateTavernRegexesWith(currentRegexes => updater(currentRegexes), { type: 'global' });
    },
  };
}
