// @flow
import React, { Component } from 'react';
import { Provider, connect } from 'react-redux';

import '../app.global.css';
import styles from './App.css';
import SortedVisibleThumbGrid from '../containers/VisibleThumbGrid';
import { getVisibleThumbs, getScaleValueObject, getMoviePrintColor } from '../utils/utils';

// export default function WorkerRoot({ store }: RootType) {
class WorkerRoot extends Component {
  render() {
    return (
      <Provider store={this.props.store}>
        <div
          ref={(r) => { this.divOfSortedVisibleThumbGridRef = r; }}
          className={`${styles.ItemMain}`}
          style={{
            width: `${this.props.scaleValueObject.newMoviePrintWidth}px`
          }}
        >
          {this.props.file &&
            <SortedVisibleThumbGrid
              inputRef={(r) => { this.sortedVisibleThumbGridRef = r; }}
              showSettings={false}

              selectedThumbId={undefined}
              // selectMethod={this.onSelectMethod}
              // onThumbDoubleClick={this.onViewToggle}

              colorArray={this.props.colorArray}
              thumbCount={this.props.file.thumbCount}

              showMoviePrintView
              scaleValueObject={this.props.scaleValueObject}
              keyObject={{}}
            />
          }
        </div>
      </Provider>
    );
  }
}

const mapStateToProps = state => {
  const tempCurrentFileId = state.undoGroup.present.settings.currentFileId;
  const tempThumbs = (state.undoGroup.present
    .thumbsByFileId[tempCurrentFileId] === undefined)
    ? undefined : state.undoGroup.present
      .thumbsByFileId[tempCurrentFileId].thumbs;
  return {
    thumbs: getVisibleThumbs(
      tempThumbs,
      state.visibilitySettings.visibilityFilter
    ),
    currentFileId: tempCurrentFileId,
    files: state.undoGroup.present.files,
    file: state.undoGroup.present.files
      .find((file) => file.id === tempCurrentFileId),
    settings: state.undoGroup.present.settings,
    visibilitySettings: state.visibilitySettings,
    defaultThumbCount: state.undoGroup.present.settings.defaultThumbCount,
    defaultColumnCount: state.undoGroup.present.settings.defaultColumnCount,
    thumbsByFileId: state.undoGroup.present.thumbsByFileId,
    colorArray: getMoviePrintColor(state.undoGroup.present.settings.defaultThumbCountMax),
    scaleValueObject: getScaleValueObject(
      state.undoGroup.present.files.find((file) => file.id === tempCurrentFileId),
      state.undoGroup.present.settings,
      state.undoGroup.present.files.find((file) => file.id === tempCurrentFileId).columnCount, state.undoGroup.present.files.find((file) => file.id === tempCurrentFileId).thumbCount,
      1360, 800, // values not needed for saveMoviePrint
      state.visibilitySettings.showMoviePrintView,
      1,
      true
    )
  };
};

export default connect(mapStateToProps)(WorkerRoot);
