export const PUSH = 'APP/ROUTER/PUSH';
export const POP = 'APP/ROUTER/POP';
export const DISMISS = 'APP/ROUTER/DISMISS';
export const RESET = 'APP/ROUTER/RESET';
export const INIT = 'APP/ROUTER/INIT';
export const CUSTOM = 'APP/ROUTER/CUSTOM';
export const REPLACE = 'APP/ROUTER/REPLACE';
export const SELECT = 'APP/ROUTER/SELECT';

const filterParam = (_data = {}) => {
  let data = { ..._data };

  if (typeof data !== 'object') {
    return data;
  }

  if (!data) {
    return;
  }

  const proto = (data || {}).constructor.name;
  // avoid passing React Native parameters
  if (proto !== 'Object') {
    data = {};
  }

  if (data.data) {
    data.data = filterParam(data.data);
  }

  return data;
};

const createReducer = (type) => (data) => ({
  ...filterParam(data),
  type,
});

export const CoreActions = {
  push: createReducer(PUSH),
  pop: createReducer(POP),
  dismiss: createReducer(DISMISS),
  reset: createReducer(RESET),
  init: (initial) => ({
    initial,
    type: INIT,
  }),
  custom: createReducer(CUSTOM),
  replace: createReducer(REPLACE),
  select: createReducer(SELECT),
};

export const navigateTo = (name, method = 'push', data) => (
  CoreActions[method]({ name, data })
);

export const navigateBack = () => CoreActions.pop();
export const closeOverlay = (name) => CoreActions.dismiss({ name });
