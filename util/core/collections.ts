export function assignInplace<T>(destination: T[], newArray: T[]): T[] {
  destination.length = 0;
  destination.push(...newArray);
  return destination;
}

export function chunkBy<T>(array: T[], predicate: (lhs: T, rhs: T) => boolean): T[][] {
  if (array.length === 0) return [];

  const chunks: T[][] = [[array[0]]];
  for (const [lhs, rhs] of _.zip(_.dropRight(array), _.drop(array))) {
    if (predicate(lhs!, rhs!)) chunks[chunks.length - 1].push(rhs!);
    else chunks.push([rhs!]);
  }
  return chunks;
}

/** Merge objects while replacing arrays instead of merging their indexes. */
export function mergeReplacingArrays<TObject, TSource>(lhs: TObject, rhs: TSource): TObject & TSource {
  return _.mergeWith(lhs, rhs, (_lhs, rhsValue) => (_.isArray(rhsValue) ? rhsValue : undefined));
}
