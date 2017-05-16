import React, { Component } from 'react';
import { View, StatusBar, Navigator } from 'react-native';
import { PUSH, REPLACE, POP, DISMISS, RESET, CoreActions } from '../Redux/actions';
import Animations from '../Utils/Animations';
import { connect } from 'react-redux';
import pathToRegexp from 'path-to-regexp';
import { values, omit, get, difference } from 'lodash';
import { ModalContainer } from './Modal';

let paretnCounter = 0;

const s = {
  container: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transparent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
};

const SUPPORTED_TYPES = ['Route', 'Modal'];

const filterChildren = (children) => children.filter((child) => (
  SUPPORTED_TYPES.indexOf(child.type.displayName) + 1
));

const createItem = (child, parent) => {
  const name = `${parent && parent.path ? `${parent.path}/` : ''}${child.props.path}`;
  return {
    props: {
      name,
      pattern: pathToRegexp(name),
      component: child.props.component,
      parent: get(parent, 'name', null),
      type: get(parent, 'props.type', 'route'),
      params: {
        ...omit(child.props, ['component']),
      },
    },
    name,
  };
};

const createParent = (child) => {
  return ({
    props: {
      ...omit(child.props, ['children']),
      component: child.props.component ? React.createFactory(child.props.component) : null,
      type: child.type.displayName.toLowerCase(),
    },
    path: child.props.path || undefined,
    name: `parent-${++paretnCounter}`,
  });
};

const reduceItem = (a, b, prular, singular) => ({
  ...a[prular],
  ...b[prular] || {},
  ...(b[singular] ? { [b[singular].name]: b[singular].props } : {}),
});

/**
 * This method is used to generate router tree
 * @param  {array} children  Actual children array
 * @param  {object} parent   Closest parent to the element
 * @return {Object}          { routes: [...], parents: [...] } returns the routes & parents
 */
const processChildren = (children, parent) => (
  filterChildren(React.Children.toArray(children)).map((child) => {
    if (child.props.children) {
      return processChildren(child.props.children, createParent(child));
    }

    return {
      [child.type.displayName.toLowerCase()]: createItem(child, parent),
      parent,
    };
  }).reduce((a, b) => ({
    ...a,
    routes: reduceItem(a, b, 'routes', 'route'),
    parents: reduceItem(a, b, 'parents', 'parent'),
  }), {})
);

class Router extends Component {
  state = {
    modals: [],
  };

  componentWillMount() {
    const {
      routes,
      parents,
    } = processChildren(this.props.children);

    this.routes = routes;
    this.parents = parents;
    this.initialRoute = this.routes[this.props.initialPath];

    if (!this.initialRoute) {
      // eslint-disable-next-line no-console
      console.error('[react-native-router] no initial route defined <Router initialRoute="/">');
    }

    this.props.init(this.props.initialPath);
  }

  componentWillReceiveProps(props) {
    if (props.currentRoute !== this.props.currentRoute) {
      this.onChange(props);
    }
  }

  onChange(page) {
    const route = this.findRoute(page.currentRoute);

    if (!route) {
      // eslint-disable-next-line no-console
      console.error(`[react-native-router] No route is defined for name: ${page.currentRoute}`);
      return;
    }

    // check if route is popup
    if (route.type === 'modal' && page.mode !== DISMISS) {
      this.createModal(page, route);
      return;
    } else if (page.mode === DISMISS) {
      const routes = this.state.modals.map((m) => m.name);
      const diff = difference(this.props.routes, page.routes);

      const modals = routes.map((r, i) => {
        if (diff.indexOf(r) === -1) {
          return this.state.modals[i];
        }
      }).filter((m) => m);

      Promise.all(diff.map((m) => {
        if (this.modals[m]) {
          return this.modals[m].animate(false);
        }
        return Promise.resolve();
      })).then(() => this.setState({ modals }));
    } else if (route.type !== 'modal' && this.state.modals.length) {
      if (page.mode === POP) {
        const modals = this.state.modals;

        if (modals.length > 1) {
          modals.splice(-1, 1);
        } else {
          modals.length = 0;
        }

        this.setState({
          modals,
        });
        return;
      }

      this.setState({
        modals: [],
      });
    }

    if (page.mode === PUSH || page.mode === REPLACE) {
      if (page.mode === REPLACE) {
        this.refs.nav.replace(this.getRoute(route, page.data));
      } else {
        this.refs.nav.push(this.getRoute(route, page.data));
      }
    }

    if (page.mode === POP) {
      const routes = this.refs.nav.getCurrentRoutes();
      const num = page.num || (routes.length - page.routes.length);
      // pop only existing routes!
      if (num < routes.length) {
        this.refs.nav.popToRoute(routes[routes.length - 1 - num]);
      }
    }

    if (page.mode === RESET) {
      // reset navigation stack
      this.refs.nav.immediatelyResetRouteStack([this.getRoute(this.routes[page.initial], page.data)]);
    }
  }

  getRoute = (route, data) => {
    if (!route) {
      // eslint-disable-next-line no-console
      console.error(`No route for data: ${JSON.stringify(data)}`);
    }


    const parent = this.parents[route.parent] || {};

    const sceneConfig = get(route, 'params.transition') || parent.transition
    || Animations.FlatFloatFromRight;
    const props = { ...route, ...data };

    return {
      name: route.name,
      component: route.component,
      sceneConfig: {
        ...parent,
        ...sceneConfig,
      },
      navigationBar: get(props.params, 'navigationBar', () => ({}))(props),
      children: (
        parent.component ? parent.component({ ...parent.componentProps }) : undefined
      ),
      passProps: props,
    };
  }

  getSchene = (route) => {
    const RenderComponent = route.component;
    return (
      <View style={s.transparent}>
        <RenderComponent
          key={route.name}
          route={route}
          paddingTop={get(route, 'navigationBar.height', 0)}
          {...route.passProps}
          routes={this.routerActions}
        />
        {this.props.navigationBar(route)}
        {!!route.children && (
          React.cloneElement(route.children, {
            route,
          })
        )}
        {!!this.state.modals.length && (
          this.state.modals.map((modal) => (
            <ModalContainer
              ref={(e) => { this.modals[modal.name] = e; }}
              {...modal}
              key={modal.name}
              children={React.Children.toArray([modal.component, this.props.navigationBar(modal)])}
            />
          ))
        )}
      </View>
    );
  };

  modals = {};

  createModal(page, route) {
    const modals = [...this.state.modals];
    const parent = this.parents[route.parent];
    const isReset = page.mode === RESET || page.mode === REPLACE;
    const component = React.createElement(route.component, {
      ...route,
      ...page.data,
      paddingTop: get(route.params, 'navigationBar.height', 0),
    });

    const modal = {
      ...parent.passProps || {},
      ...route.params || {},
      component,
      transition: (
        isReset ? Animations.Modal.None :
        get(parent, 'passProps.transition', Animations.Modal.None)
      ),
      name: route.name,
    };

    if (!isReset || !modals.length) {
      modals.push(modal);
    } else {
      modals.splice(modals.length - 1, 1, modal);
    }

    this.setState({
      modals,
    });
  }

  findRoute(currentRoute) {
    if (this.routes[currentRoute]) {
      return this.routes[currentRoute];
    }

    const route = values(this.routes).find((r) => r.pattern.test(currentRoute));
    const data = route.pattern.exec(currentRoute);
    const params = route.pattern.exec(route.name).reduce((a, b, index) => {
      if (index % 1 === 0 && /^:/.test(b)) {
        return {
          ...a,
          [b.substring(1)]: data[index],
        };
      }

      return a;
    }, {});

    return {
      ...this.routes[route.name],
      params: {
        ...this.routes[route.name].params,
        ...params,
      },
    };
  }

  routes = {};
  parents = {};

  render() {
    return (
      <View style={s.transparent}>
        <StatusBar {...this.props.defaultStatusBar} />
        <Navigator
          renderScene={(route) => (
            this.getSchene(route)
          )}
          configureScene={(route) => route.sceneConfig}
          ref="nav"
          initialRoute={this.getRoute(this.initialRoute)}
        />
      </View>
    );
  }
}

Router.defaultProps = {
  defaultStatusBar: {},
  navigationBar: () => null,
};
Router.propTypes = {
  children: React.PropTypes.array,
  defaultStatusBar: React.PropTypes.object,
  initialPath: React.PropTypes.string,
  currentRoute: React.PropTypes.string,
  init: React.PropTypes.func,
  navigationBar: React.PropTypes.func,
  routes: React.PropTypes.array,
};


const mapDispatchToProps = (dispatch) => ({
  init: (props) => dispatch(CoreActions.init(props)),
});

const mapStateToProps = (state, ownProps) => ({
  ...state[ownProps.reducerName || 'routerReducer'],
});

export default connect(mapStateToProps, mapDispatchToProps)(Router);
