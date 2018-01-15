import { INIT, PUSH, REPLACE, POP, DISMISS, RESET } from './actions';

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

const createRoute = (action) => ({ path: action.name, data: action.data });
const getLatestRoutePath = (state) => (state.routes.slice(-1)[0]|| {}).path;
let _currentRoute;

export default function reducer(state = { routes: [], currentRoute: null }, action) {
  switch (action.type) {
    case INIT:
      return {
        routes: [{ path: action.initial, data: {}, }],
        currentRoute: action.initial,
      };
    case PUSH:
      if (getLatestRoutePath(state) === action.name) {
        return state;
      }

      return {
        data: action.data || null,
        mode: PUSH,
        routes: [...state.routes, createRoute(action)],
        currentRoute: action.name,
      };
    case REPLACE:
      if (getLatestRoutePath(state) === action.name) {
        return state;
      }

      return {
        data: action.data || null,
        mode: REPLACE,
        routes: [...state.routes.slice(0, state.routes.length - 1), createRoute(action)],
        currentRoute: action.name,
      };
    case POP:
      let num = isNumeric(action.data) ? action.data : 1;
      if (state.routes.length <= num) {
        num = state.routes.length - 1;
      }
      _currentRoute = state.routes[state.routes.length - num - 1];
      return {
        mode: POP,
        data: _currentRoute.data,
        routes: [...state.routes.slice(0, state.routes.length - num)],
        currentRoute: _currentRoute.path,
      };
    case DISMISS:
      if (state.routes.length === 1) {
        return state;
      }

      if (!action.name) {
        _currentRoute = state.routes[state.routes.length - 2];
        return {
          mode: DISMISS,
          data: _currentRoute.data,
          routes: [...state.routes.slice(0, state.routes.length - 1)],
          currentRoute: _currentRoute.path,
        };
      }

      const routes = [...state.routes.filter((r) => r.path !== action.name)];
      _currentRoute = [...routes].pop() || {};
      return {
        mode: DISMISS,
        routes,
        data: _currentRoute.data,
        currentRoute: _currentRoute.path,
      };

    case RESET:
      if (getLatestRoutePath(state) === action.name) {
        return state;
      }
      return {
        mode: RESET,
        data: action.data || null,
        routes: [...state.routes, createRoute(action)],
        initial: action.name,
        currentRoute: action.name,
      };

    default:
      return state;
  }
}
