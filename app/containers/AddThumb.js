import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { addThumb } from '../actions';

class AddThumb extends Component {
  componentDidMount() {
    const { store } = this.context;
    this.unsubscribe = store.subscribe(() => this.forceUpdate());
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  render() {
    const { store } = this.context;

    return (
      <div>
        <form
          onSubmit={e => {
            e.preventDefault();
            store.dispatch(addThumb('This is a new thumb', store.getState().undoGroup.present.thumbsByFileId.length));
          }}
        >
          <button type="submit">
            Add Thumb
          </button>
        </form>
      </div>
    );
  }
}
AddThumb.contextTypes = {
  store: PropTypes.object
};

export default AddThumb;
