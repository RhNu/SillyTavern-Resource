export type NamedItems<T> = {
  selected: string;
  items: Record<string, T>;
};

export function resolveSelectedNamedItemName<T>(collection: NamedItems<T>): string {
  if (collection.selected in collection.items) {
    return collection.selected;
  }

  return Object.keys(collection.items)[0] ?? '';
}

export function getSelectedNamedItem<T>(collection: NamedItems<T>): T | undefined {
  const selected = resolveSelectedNamedItemName(collection);
  return selected ? collection.items[selected] : undefined;
}

export function normalizeNamedItems<T>(collection: NamedItems<T>, fallbackItems: Record<string, T>): NamedItems<T> {
  const items = Object.keys(collection.items).length > 0 ? { ...collection.items } : { ...fallbackItems };

  return {
    selected: resolveSelectedNamedItemName({
      selected: collection.selected,
      items,
    }),
    items,
  };
}

export function selectNamedItem<T>(collection: NamedItems<T>, name: string): NamedItems<T> {
  if (!(name in collection.items)) {
    return collection;
  }

  return {
    ...collection,
    selected: name,
  };
}

export function saveNamedItem<T>(collection: NamedItems<T>, draftName: string, value: T): NamedItems<T> {
  const nextName = draftName.trim() || resolveSelectedNamedItemName(collection);
  if (!nextName) {
    return collection;
  }

  return {
    selected: nextName,
    items: {
      ...collection.items,
      [nextName]: value,
    },
  };
}

export function deleteNamedItem<T>(collection: NamedItems<T>, name: string): NamedItems<T> {
  if (!(name in collection.items) || Object.keys(collection.items).length <= 1) {
    return collection;
  }

  const items = { ...collection.items };
  delete items[name];

  return {
    selected:
      collection.selected === name
        ? Object.keys(items)[0] ?? ''
        : resolveSelectedNamedItemName({
            selected: collection.selected,
            items,
          }),
    items,
  };
}

export function injectNamedItems<T>(collection: NamedItems<T>, injectedItems: Record<string, T>): NamedItems<T> {
  const items = {
    ...collection.items,
    ...injectedItems,
  };

  return {
    selected: resolveSelectedNamedItemName({
      selected: collection.selected,
      items,
    }),
    items,
  };
}
