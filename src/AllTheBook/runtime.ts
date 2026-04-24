import type { Logger } from '@util/common';

import { LAST_SCAN_TTL_MS, SCAN_PROMPT_ID_PREFIX } from './constants';
import { collectContextWorldbookNames, createContextSignature } from './context';
import { buildPreparedScanPayload, collectSelectiveEntries } from './payload';
import type { LastInjectionRecord, PreparedScanPayload } from './types';

function collectActivatedEntryKeys(
  eventData: Parameters<ListenerType[typeof tavern_events.WORLDINFO_SCAN_DONE]>[0],
): Set<string> {
  const entries = eventData.activated.entries;
  if (entries instanceof Map) {
    return new Set([...entries.keys()].map(String));
  }

  if (entries && typeof entries === 'object') {
    return new Set(Object.keys(entries));
  }

  return new Set();
}

export function createAllTheBookRuntime(logger: Logger) {
  let destroyed = false;
  let preparedPayload: PreparedScanPayload | null = null;
  let refreshPromise: Promise<void> | null = null;
  let queuedRefreshReason: string | null = null;
  let injectionSequence = 0;
  let lastInjection: LastInjectionRecord | null = null;

  const performRefresh = async (reason: string): Promise<void> => {
    const worldbookNames = collectContextWorldbookNames(logger);
    const signature = createContextSignature(worldbookNames);
    logger.info(`Refreshing prepared scan payload.`, {
      reason,
      worldbookCount: worldbookNames.length,
    });

    const entries = await collectSelectiveEntries(worldbookNames, logger);
    if (destroyed) {
      logger.debug('Refresh finished after runtime was destroyed; ignoring result.');
      return;
    }

    const latestWorldbookNames = collectContextWorldbookNames(logger);
    const latestSignature = createContextSignature(latestWorldbookNames);
    if (latestSignature !== signature) {
      queuedRefreshReason = 'refresh-context-changed';
      logger.warn('Worldbook context changed during refresh; discarding stale payload and refreshing again.', {
        previousWorldbookCount: worldbookNames.length,
        latestWorldbookCount: latestWorldbookNames.length,
      });
      return;
    }

    preparedPayload = buildPreparedScanPayload(signature, entries);

    logger.info(
      `Prepared ${preparedPayload.expectedActivatedKeys.length} deterministic selective entrie(s) from ${worldbookNames.length} worldbook(s).`,
      {
        reason,
        unresolved: preparedPayload.unresolvedEntries.length,
        warnings: preparedPayload.warningEntries.length,
        promptChunks: preparedPayload.promptContents.length,
      },
    );

    if (preparedPayload.unresolvedEntries.length > 0) {
      logger.warn('Some selective entries cannot be deterministically triggered.', {
        sample: preparedPayload.unresolvedEntries.slice(0, 8),
        total: preparedPayload.unresolvedEntries.length,
      });
    }

    if (preparedPayload.warningEntries.length > 0) {
      logger.warn('Some selective entries have non-deterministic trigger caveats.', {
        sample: preparedPayload.warningEntries.slice(0, 8),
        total: preparedPayload.warningEntries.length,
      });
    }
  };

  const scheduleRefresh = (reason: string): void => {
    if (destroyed) {
      return;
    }

    queuedRefreshReason = reason;
    if (refreshPromise) {
      logger.debug('Refresh is already running; queued latest refresh reason.', { reason });
      return;
    }

    refreshPromise = (async () => {
      while (!destroyed && queuedRefreshReason) {
        const nextReason = queuedRefreshReason;
        queuedRefreshReason = null;
        await performRefresh(nextReason);
      }
    })()
      .catch(error => {
        logger.error('Failed to refresh prepared payload.', error);
      })
      .finally(() => {
        refreshPromise = null;
        if (!destroyed && queuedRefreshReason) {
          scheduleRefresh(queuedRefreshReason);
        }
      });
  };

  const injectPreparedPrompts = (payload: PreparedScanPayload): void => {
    if (payload.promptContents.length === 0 || payload.expectedActivatedKeys.length === 0) {
      logger.info('No selectable entry can be triggered for current context.', {
        promptChunks: payload.promptContents.length,
        expectedEntries: payload.expectedActivatedKeys.length,
      });
      lastInjection = null;
      return;
    }

    injectionSequence += 1;
    try {
      injectPrompts(
        payload.promptContents.map((content, index) => ({
          id: `${SCAN_PROMPT_ID_PREFIX}-${injectionSequence}-${index}`,
          position: 'none',
          depth: 0,
          role: 'system',
          content,
          should_scan: true,
        })),
        { once: true },
      );
    } catch (error) {
      lastInjection = null;
      logger.error('Failed to inject scan prompt chunks.', error);
      return;
    }

    lastInjection = {
      injectedAt: Date.now(),
      expectedActivatedKeys: [...payload.expectedActivatedKeys],
    };

    logger.info(`Injected ${payload.promptContents.length} scan prompt chunk(s).`, {
      expectedEntries: payload.expectedActivatedKeys.length,
      sequence: injectionSequence,
    });
  };

  const generationListener = eventOn(tavern_events.GENERATION_AFTER_COMMANDS, (_type, _option, dryRun) => {
    if (dryRun) {
      logger.debug('Skipping dry-run generation.');
      return;
    }

    const signature = createContextSignature(collectContextWorldbookNames(logger));
    if (!preparedPayload) {
      logger.warn('Prepared payload is not ready. Skipping this generation and refreshing cache.');
      scheduleRefresh('generation-before-ready');
      return;
    }

    if (preparedPayload.signature !== signature) {
      logger.warn('Prepared payload is stale for current context. Skipping this generation and refreshing cache.');
      scheduleRefresh('generation-context-mismatch');
      return;
    }

    injectPreparedPrompts(preparedPayload);
  });

  const scanDoneListener = eventOn(tavern_events.WORLDINFO_SCAN_DONE, eventData => {
    if (!lastInjection) {
      logger.debug('World info scan completed without a matching AllTheBook injection.');
      return;
    }

    if (Date.now() - lastInjection.injectedAt > LAST_SCAN_TTL_MS) {
      logger.warn('World info scan completed after the injection tracking window expired.');
      lastInjection = null;
      return;
    }

    const activatedKeys = collectActivatedEntryKeys(eventData);
    if (activatedKeys.size === 0) {
      logger.warn('World info scan result did not expose activated entry keys.');
    }

    const missing = lastInjection.expectedActivatedKeys.filter(entryKey => !activatedKeys.has(entryKey));
    const hit = lastInjection.expectedActivatedKeys.length - missing.length;

    if (missing.length === 0) {
      logger.info(`All targeted selective entries activated (${hit}/${lastInjection.expectedActivatedKeys.length}).`);
    } else {
      logger.warn(
        `Targeted selective entries partially activated (${hit}/${lastInjection.expectedActivatedKeys.length}).`,
        {
          missingSample: missing.slice(0, 10),
          missingCount: missing.length,
          activatedCount: activatedKeys.size,
        },
      );
    }

    lastInjection = null;
  });

  const refreshTriggers = [
    eventOn(tavern_events.CHAT_CHANGED, () => {
      logger.debug('Refresh trigger received: chat-changed.');
      scheduleRefresh('chat-changed');
    }),
    eventOn(tavern_events.WORLDINFO_UPDATED, () => {
      logger.debug('Refresh trigger received: worldinfo-updated.');
      scheduleRefresh('worldinfo-updated');
    }),
    eventOn(tavern_events.WORLDINFO_SETTINGS_UPDATED, () => {
      logger.debug('Refresh trigger received: worldinfo-settings-updated.');
      scheduleRefresh('worldinfo-settings-updated');
    }),
    eventOn(tavern_events.WORLDINFO_ENTRIES_LOADED, () => {
      logger.debug('Refresh trigger received: worldinfo-entries-loaded.');
      scheduleRefresh('worldinfo-entries-loaded');
    }),
    eventOn(tavern_events.CHARACTER_PAGE_LOADED, () => {
      logger.debug('Refresh trigger received: character-page-loaded.');
      scheduleRefresh('character-page-loaded');
    }),
    eventOn(tavern_events.CHARACTER_EDITED, () => {
      logger.debug('Refresh trigger received: character-edited.');
      scheduleRefresh('character-edited');
    }),
  ];

  scheduleRefresh('bootstrap');

  return {
    destroy() {
      destroyed = true;
      generationListener.stop();
      scanDoneListener.stop();
      for (const listener of refreshTriggers) {
        listener.stop();
      }
      logger.debug('Runtime event listeners stopped.');
    },
  };
}
