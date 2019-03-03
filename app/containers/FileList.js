// @flow
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import FileListElement from '../components/FileListElement';
import styles from '../components/FileList.css';
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
    const { files, settings, posterObjectUrlObjects, visibilitySettings } = this.props;

    return (
      <div
        style={{
          marginBottom: `${MENU_HEADER_HEIGHT + MENU_FOOTER_HEIGHT}px`,
          // direction: 'ltr', // compensate for rtl on ItemMovieList to get scroolbar appear on left hand side
        }}
      >
        <ul
          className={`${styles.MainList}`}
        >
          {files.map((file, index) => (
            <FileListElement
              key={file.id}
              fileId={file.id}
              {...file}
              index={index}
              onFileListElementClick={this.props.onFileListElementClick}
              onSetSheetClick={this.props.onSetSheetClick}
              onChangeSheetTypeClick={this.props.onChangeSheetTypeClick}
              onDuplicateSheetClick={this.props.onDuplicateSheetClick}
              onScanMovieListItemClick={this.props.onScanMovieListItemClick}
              onRemoveMovieListItem={this.props.onRemoveMovieListItem}
              onDeleteSheetClick={this.props.onDeleteSheetClick}
              currentFileId={settings.currentFileId}
              currentSheetId={this.props.currentSheetId}
              objectUrl={
                getObjectProperty(() => posterObjectUrlObjects[file.posterFrameId].objectUrl)
              }
              sheetsObject={
                this.props.sheetsByFileId[file.id] === undefined ?
                {} : this.props.sheetsByFileId[file.id]
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
