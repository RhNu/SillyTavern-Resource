import { defineMvuDataStore } from '@util/tavern-helper/state/mvu-store';
import { Schema } from '../../schema';

export const useDataStore = defineMvuDataStore(Schema, { type: 'message', message_id: getCurrentMessageId() });
