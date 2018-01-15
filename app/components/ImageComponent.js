import React, { Component } from 'react';
import PropTypes from 'prop-types';
// import mpLogo from './../img/MoviePrint_Logo_v002_128.jpg';
// import base64ArrayBuffer from './../utils/base64ArrayBuffer'

let temp = [];

class ImageComponent extends Component {
  componentDidMount() {
    const { store } = this.context;
    this.unsubscribe = store.subscribe(() => this.forceUpdate());
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  render() {
    const { store } = this.context;
    const state = store.getState();

    return (
      <div>
        <img src={temp} alt="mpLogo" width="300px" height="300px" />
      </div>
    );
  }
}

ImageComponent.contextTypes = {
  store: PropTypes.object
};

export default ImageComponent;
