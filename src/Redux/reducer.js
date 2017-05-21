import { INIT, PUSH, REPLACE, POP, DISMISS, RESET } from './actions';

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

export default function reducer(state = { routes: [], currentRoute: null }, action) {
  switch (action.type) {
    case INIT:
      return {
        routes: [action.initial],
        currentRoute: action.initial,
      };
    case PUSH:
      return {
        data: action.data || null,
        mode: PUSH,
        routes: [...state.routes, action.name],
        currentRoute: action.name,
      };
    case REPLACE:
      return {
        data: action.data || null,
        mode: REPLACE,
        routes: [...state.routes.slice(0, state.routes.length - 1), action.name],
        currentRoute: action.name,
      };
    case POP:
      const num = isNumeric(action.data) ? action.data : 1;
      if (state.routes.length <= num) {
        throw new Error("Number of routes should be greater than pop() param: " + num);
      }
      return {
        mode: POP,
        routes: [...state.routes.slice(0, state.routes.length - num)],
        currentRoute: state.routes[state.routes.length - num - 1],
      };
    case DISMISS:
      if (state.routes.length === 1) {
        return state;
      }

      if (!action.name) {
        return {
          mode: DISMISS,
          routes: [...state.routes.slice(0, state.routes.length - 1)],
          currentRoute: state.routes[state.routes.length - 2],
        };
      }

      return {
        mode: DISMISS,
        routes: [...state.routes.filter((r) => r !== action.name)],
        currentRoute: state.routes[state.routes.length - 2],
      };

    case RESET:
      return {
        mode: RESET,
        data: action.data || null,
        routes: [action.name],
        initial: action.name,
        currentRoute: action.name,
      };

    default:
      return state;
  }
}
