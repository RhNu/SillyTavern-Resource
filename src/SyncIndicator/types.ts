export type SyncVisualState = 'idle' | 'syncing';

export type TrackerSnapshot = {
  pendingCount: number;
  state: SyncVisualState;
};

export type DestroyHandle = {
  destroy: () => void;
};

export type TrackerListener = (snapshot: TrackerSnapshot) => void;

export type TrackerHandle = DestroyHandle & {
  getSnapshot: () => TrackerSnapshot;
};

export type SyncIndicatorView = DestroyHandle & {
  render: (snapshot: TrackerSnapshot) => void;
  requestRemount: () => void;
};
