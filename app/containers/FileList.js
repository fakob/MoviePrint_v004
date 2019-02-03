// @flow
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import FileListElement from '../components/FileListElement';
import {
  updateObjectUrlsFromPosterFrame,
} from '../actions';
import { MENU_HEADER_HEIGHT, MENU_FOOTER_HEIGHT } from '../utils/constants';

class SortedFileList extends Component {
  componentDidMount() {
    const { store } = this.context;
    this.unsubscribe = store.subscribe(() => this.forceUpdate());
    // if (store.getState().undoGroup.present.files.length !== 0) {
    //   store.dispatch(updateObjectUrlsFromPosterFrame());
    // }
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  render() {
    const { store } = this.context;
    const state = store.getState();

    return (
      <div
        style={{
          marginBottom: `${MENU_HEADER_HEIGHT + MENU_FOOTER_HEIGHT}px`,
        }}
      >
        <ul>
          {state.undoGroup.present.files.map((file, index) => (
            <FileListElement
              key={file.id}
              {...file}
              index
              onClick={() => {
                this.props.onFileListElementClick(file);
              }}
              currentFileId={state.undoGroup.present.settings.currentFileId}
              onErrorPosterFrame={() => this.props.onErrorPosterFrame(file)}
            />
          ))}
        </ul>
      </div>
    );
  }
}

SortedFileList.contextTypes = {
  store: PropTypes.object
};

export default SortedFileList;
