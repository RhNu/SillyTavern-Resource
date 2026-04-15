import { create, type StoreApi, type UseBoundStore } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type MvuDataStoreState<T> = {
  data: T;
  setData: (value: T | ((old_data: T) => T)) => void;
  syncNow: () => void;
};

export type MutableRefLike<T> = {
  value: T;
};

export function defineMvuDataStore<T extends z.ZodObject>(
  schema: T,
  variable_option: VariableOption,
  additional_setup?: (
    data: MutableRefLike<z.infer<T>>,
    store: UseBoundStore<StoreApi<MvuDataStoreState<z.infer<T>>>>,
  ) => void,
): UseBoundStore<StoreApi<MvuDataStoreState<z.infer<T>>>> {
  if (
    variable_option.type === 'message' &&
    (variable_option.message_id === undefined || variable_option.message_id === 'latest')
  ) {
    variable_option.message_id = -1;
  }

  const store_id = `mvu_data.${_(variable_option)
    .entries()
    .sortBy(entry => entry[0])
    .map(entry => entry[1])
    .join('.')}`;

  const initial_data = schema.parse(_.get(getVariables(variable_option), 'stat_data', {}), {
    reportInput: true,
  }) as z.infer<T>;

  let syncing_from_variables = false;

  const store = create<MvuDataStoreState<z.infer<T>>>()(
    subscribeWithSelector((set, get) => ({
      data: initial_data,
      setData: value => {
        const current = get().data;
        const next_data = typeof value === 'function' ? value(current) : value;
        const result = schema.safeParse(next_data);
        if (result.error) {
          return;
        }
        if (!_.isEqual(current, result.data)) {
          set({ data: result.data });
        }
      },
      syncNow: () => {
        const stat_data = _.get(getVariables(variable_option), 'stat_data', {});
        const result = schema.safeParse(stat_data);
        if (result.error) {
          return;
        }

        if (!_.isEqual(get().data, result.data)) {
          syncing_from_variables = true;
          set({ data: result.data });
          syncing_from_variables = false;
        }

        if (!_.isEqual(stat_data, result.data)) {
          updateVariablesWith(variables => _.set(variables, 'stat_data', result.data), variable_option);
        }
      },
    })),
  );

  store.subscribe(
    state => state.data,
    new_data => {
      if (syncing_from_variables) {
        return;
      }

      const result = schema.safeParse(new_data);
      if (result.error) {
        return;
      }

      if (!_.isEqual(new_data, result.data)) {
        syncing_from_variables = true;
        store.setState({ data: result.data });
        syncing_from_variables = false;
      }

      updateVariablesWith(variables => _.set(variables, 'stat_data', result.data), variable_option);
    },
    { equalityFn: _.isEqual },
  );

  if (additional_setup) {
    additional_setup(
      {
        get value() {
          return store.getState().data;
        },
        set value(new_data) {
          store.getState().setData(new_data);
        },
      },
      store,
    );
  }

  setInterval(
    errorCatched(() => store.getState().syncNow()),
    2000,
  );
  store.getState().syncNow();

  console.info(`[mvu] initialized ${store_id}`);
  return store;
}
