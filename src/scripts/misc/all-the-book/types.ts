export type SelectiveTargetEntry = {
  worldbookName: string;
  uid: number;
  name: string;
  strategy: WorldbookEntry['strategy'];
};

export type PreparedScanPayload = {
  signature: string;
  expectedActivatedKeys: string[];
  promptContents: string[];
  unresolvedEntries: string[];
  warningEntries: string[];
};

export type LastInjectionRecord = {
  injectedAt: number;
  expectedActivatedKeys: string[];
};

export type TriggerTokenResult = {
  tokens: string[];
  unresolvedReason?: string;
  warningReason?: string;
};
