export function getHostContext() {
  try {
    return {
      doc: parent?.document ?? document,
      win: parent?.window ?? window,
    };
  } catch (_error) {
    return {
      doc: document,
      win: window,
    };
  }
}
