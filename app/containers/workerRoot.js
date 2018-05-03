// @flow
import React, { Component } from 'react';
import { Provider } from 'react-redux';
import { connect } from 'react-redux';

import '../app.global.css';
import styles from './App.css';
import SortedVisibleThumbGrid from '../containers/VisibleThumbGrid';
import { getVisibleThumbs, getScaleValueObject, getMoviePrintColor } from '../utils/utils';
import { MENU_HEADER_HEIGHT, MENU_FOOTER_HEIGHT } from '../utils/constants';

type RootType = {
  store: {}
};

// export default function WorkerRoot({ store }: RootType) {
class WorkerRoot extends Component {
  render() {
    return (
      <Provider store={this.props.store}>
        <div
          ref={(r) => { this.divOfSortedVisibleThumbGridRef = r; }}
          className={`${styles.ItemMain} ${this.props.visibilitySettings.showMovielist ? styles.ItemMainLeftAnim : ''} ${this.props.visibilitySettings.showSettings ? styles.ItemMainRightAnim : ''} ${this.props.visibilitySettings.showSettings ? styles.ItemMainEdit : ''} ${!this.props.visibilitySettings.showMoviePrintView ? styles.ItemMainTopAnim : ''}`}
          style={{
            width: this.props.visibilitySettings.showMoviePrintView
            ? undefined : this.props.scaleValueObject.newMoviePrintWidth,
            marginTop: this.props.visibilitySettings.showMoviePrintView ? undefined :
              `${this.props.scaleValueObject.videoPlayerHeight +
                (this.props.settings.defaultBorderMargin * 2)}px`,
            minHeight: this.props.visibilitySettings.showMoviePrintView ? `calc(100vh - ${(MENU_HEADER_HEIGHT + MENU_FOOTER_HEIGHT)}px)` : undefined
          }}
        >
          <SortedVisibleThumbGrid
            inputRef={(r) => { this.sortedVisibleThumbGridRef = r; }}
            showSettings={this.props.visibilitySettings.showSettings}

            selectedThumbId={undefined}
            // selectMethod={this.onSelectMethod}
            // onThumbDoubleClick={this.onViewToggle}

            colorArray={this.props.colorArray}
            thumbCount={this.props.file.thumbCount}

            showMoviePrintView={this.props.visibilitySettings.showMoviePrintView}
            scaleValueObject={this.props.scaleValueObject}
            // keyObject={this.state.keyObject}
          />
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
      1360, 800,
      state.visibilitySettings.showMoviePrintView,
      1
    )
  };
};

export default connect(mapStateToProps)(WorkerRoot);
