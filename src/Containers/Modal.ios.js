import React, { Component } from 'react';
import { View, Dimensions, LayoutAnimation } from 'react-native';
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
};

const MODAL_ANIMATIONS = {
  [FADE]: {
    duration: 500,
    create: {
      type: LayoutAnimation.Types.spring,
      property: LayoutAnimation.Properties.opacity,
      springDamping: 0.8,
    },
    delete: {
      type: LayoutAnimation.Types.spring,
      property: LayoutAnimation.Properties.opacity,
    },
    update: {
      type: LayoutAnimation.Types.spring,
      springDamping: 0.8,
    },
  },
};

class ModalContainer extends Component {
  state = {
    animation: 0,
  };

  componentDidMount() {
    if (this.props.transition !== NONE) {
      LayoutAnimation.configureNext(MODAL_ANIMATIONS[FADE]);
    }
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
    if (this.props.transition !== SLIDE) {
      LayoutAnimation.configureNext(MODAL_ANIMATIONS[FADE]);
      resolve();
      return;
    }

    LayoutAnimation.configureNext(MODAL_ANIMATIONS[FADE], resolve);
    this.setState({ animation: show ? WINDOW_HEIGHT : 0 });
  });

  render() {
    return (
      <View style={s.root}
        key={`container-${this.props.name}`}
        onLayout={() => {
          if (!this.visible && this.props.transition === SLIDE) {
            this.visible = true;
            this.animate();
          }
        }}
      >
        <View
          key={`root-${this.props.name}`}
          style={[s.wrapper, getAnimatedValue(this.props.transition, this.state.animation)]}
        >
          {this.getBackgorundComponent()}
          <View style={[s.container, { justifyContent: this.props.justifyContent }]}>
            <View style={[s.innerContainer, this.props.style]}>
              {this.props.children}
            </View>
          </View>
        </View>
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
  name: View.propTypes.style,
};

export { ModalContainer };
