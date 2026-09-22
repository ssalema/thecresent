/**
 * Bounded-concurrency mapping, written for the upload paths.
 *
 * Projects and galleries accept up to thirty images per request and used to
 * send them to Cloudinary one at a time, inside a `for … await` loop. Each
 * upload is a full round trip carrying a multi-megabyte file, so thirty of them
 * cost thirty round trips end to end — the slowest thing the admin panel does,
 * and almost all of it spent waiting rather than working.
 *
 * Why not `Promise.all`: it is the *rejection* behaviour that matters here, not
 * the concurrency. `Promise.all` settles as soon as one task rejects, while its
 * siblings keep running unobserved. For an upload that means a file that
 * finishes after the failure lands on Cloudinary with nothing pointing at it and
 * nothing left to clean it up — a silent leak, paid for monthly.
 *
 * So every task started here is allowed to settle before this returns, and a
 * failure hands back what did succeed for the caller to roll back.
 */

/**
 * Run `task` over `items` with at most `limit` in flight, preserving order.
 *
 * Resolves to the results in input order. On failure it throws the first error
 * by input order, with `error.settled` carrying every value that did succeed —
 * which is exactly what the controllers' rollbackUploads() needs.
 *
 * Once one task has failed the remaining items are never started: the request
 * is already lost, and each further upload would be one more asset to roll
 * back. Tasks already in flight are still awaited.
 */
export const mapWithLimit = async (items, limit, task) => {
  const list = Array.from(items ?? []);
  if (list.length === 0) return [];

  const results = new Array(list.length);
  const errors = new Array(list.length);
  let cursor = 0;
  let failed = false;

  const worker = async () => {
    while (cursor < list.length) {
      if (failed) return;

      const index = cursor++;
      try {
        results[index] = await task(list[index], index);
      } catch (err) {
        // Recorded by index rather than thrown, so the workers still running
        // alongside this one finish and are accounted for.
        failed = true;
        errors[index] = err;
      }
    }
  };

  const workers = Math.max(1, Math.min(limit, list.length));
  await Promise.all(Array.from({ length: workers }, worker));

  const firstError = errors.find(Boolean);
  if (firstError) {
    // Sparse: the tasks that never started leave holes, and a task that
    // resolved to undefined has nothing to roll back either way.
    firstError.settled = results.filter((value) => value !== undefined);
    throw firstError;
  }

  return results;
};
