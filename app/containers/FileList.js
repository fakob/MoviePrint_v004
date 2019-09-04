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
    const { files, settings, posterobjectUrlObjects, visibilitySettings } = this.props;

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
          {files.length === 0 ?
            (
              <div
                className={`${styles.emptyFilelist}`}
              >
                The movie list is empty.
                <br /><br />
                Please drag in one or more movies.
              </div>
            ) :
            (files.map((file, index) => (
            <FileListElement
              key={file.id}
              fileId={file.id}
              {...file}
              index={index}
              onFileListElementClick={this.props.onFileListElementClick}
              onAddIntervalSheetClick={this.props.onAddIntervalSheetClick}
              onSetSheetClick={this.props.onSetSheetClick}
              onChangeSheetViewClick={this.props.onChangeSheetViewClick}
              onDuplicateSheetClick={this.props.onDuplicateSheetClick}
              onExportSheetClick={this.props.onExportSheetClick}
              onScanMovieListItemClick={this.props.onScanMovieListItemClick}
              onReplaceMovieListItemClick={this.props.onReplaceMovieListItemClick}
              onEditTransformListItemClick={this.props.onEditTransformListItemClick}
              onRemoveMovieListItem={this.props.onRemoveMovieListItem}
              onDeleteSheetClick={this.props.onDeleteSheetClick}
              currentFileId={settings.currentFileId}
              currentSheetId={this.props.currentSheetId}
              objectUrl={posterobjectUrlObjects[file.posterFrameId]}
              sheetsObject={
                this.props.sheetsByFileId[file.id] === undefined ?
                {} : this.props.sheetsByFileId[file.id]
              }
            />
          )))
          }
        </ul>
      </div>
    );
  }
}

SortedFileList.contextTypes = {
  store: PropTypes.object
};

export default SortedFileList;
