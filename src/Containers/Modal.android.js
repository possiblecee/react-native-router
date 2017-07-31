import React, { Component } from 'react';
import { View, Dimensions, Animated } from 'react-native';
import Animations from '../Utils/Animations';
import { get } from 'lodash';

const {
  Slide: SLIDE,
  Fade: FADE,
  None: NONE,
} = Animations.Modal;

export const {
  width: WINDOW_WIDTH,
  height: WINDOW_HEIGHT,
} = Dimensions.get('window');

const s = {
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    justifyContent: 'flex-end',
  },
  wrapper: {
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
  },
  container: {
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    backgroundColor: 'transparent',
  },
  backgroundComponent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  innerContainer: {
    alignSelf: 'stretch',
    backgroundColor: 'transparent',
  },
};

const getAnimatedValue = (type, value) => {
  if (type === SLIDE) {
    return {
      height: value,
    };
  }
  return {
    opacity: value,
  };
};

class ModalContainer extends Component {
  state = {
    animation: new Animated.Value(0),
  };

  componentDidMount() {
    if (this.props.transition !== NONE) {
      this.animate();
    }
  }

  getTarget(show) {
    if (this.props.transition === SLIDE) {
      return show ? WINDOW_HEIGHT : 0;
    }

    return show ? 1 : 0;
  }

  getBackgorundComponent() {
    const backgroundComponent =
    get(this.props, 'params.backgroundComponent', get(this.props, 'backgroundComponent'));

    if (backgroundComponent) {
      return (
        <View
          style={s.backgroundComponent}
          children={React.createElement(backgroundComponent)}
        />
      );
    }

    return null;
  }

  animate = (show = true) => new Promise((resolve) => {
    Animated.timing(this.state.animation, {
      toValue: this.getTarget(show),
      duration: 300,
    }).start(resolve);
  });

  render() {
    return (
      <View style={s.root} key={`container-${this.props.name}`} pointerEvents="box-none">
        <Animated.View
          key={`root-${this.props.name}`}
          pointerEvents="box-none"
          style={[s.wrapper, getAnimatedValue(this.props.transition, this.state.animation)]}
        >
          <View
            pointerEvents="box-none"
            style={[s.container, { justifyContent: this.props.justifyContent }]}
          >
            {this.getBackgorundComponent()}
            <View
              pointerEvents="box-none"
              style={[s.innerContainer, this.props.style]}
            >
              {this.props.children}
            </View>
          </View>
        </Animated.View>
      </View>
    );
  }
}

ModalContainer.defaultProps = {
  height: WINDOW_WIDTH,
  justifyContent: 'center',
};

ModalContainer.propTypes = {
  children: React.PropTypes.array,
  transition: React.PropTypes.oneOf([SLIDE, FADE, NONE]),
  justifyContent: React.PropTypes.string,
  style: View.propTypes.style,
  name: React.PropTypes.string,
};

export { ModalContainer };
