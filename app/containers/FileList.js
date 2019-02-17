// @flow
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import FileListElement from '../components/FileListElement';
import {
  getObjectProperty,
} from '../utils/utils';
import { MENU_HEADER_HEIGHT, MENU_FOOTER_HEIGHT } from '../utils/constants';

class SortedFileList extends Component {
  componentDidMount() {
    const { store } = this.context;
    this.unsubscribe = store.subscribe(() => this.forceUpdate());
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  render() {
    const { files, settings, posterObjectUrlObjects } = this.props;

    return (
      <div
        style={{
          marginBottom: `${MENU_HEADER_HEIGHT + MENU_FOOTER_HEIGHT}px`,
          direction: 'ltr', // compensate for rtl on ItemMovieList to get scroolbar appear on left hand side
        }}
      >
        <ul>
          {files.map((file, index) => (
            <FileListElement
              key={file.id}
              {...file}
              index
              onClick={() => {
                this.props.onFileListElementClick(file);
              }}
              currentFileId={settings.currentFileId}
              objectUrl={
                getObjectProperty(() => posterObjectUrlObjects[file.posterFrameId].objectUrl)
              }
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
