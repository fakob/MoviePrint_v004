import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Slider, { Range } from 'rc-slider';
import Tooltip from 'rc-tooltip';
import { Button, Grid, Segment, Container, Statistic, Divider } from 'semantic-ui-react';
import { arrayMove } from 'react-sortable-hoc';
import { toggleThumb, updateOrder, removeThumb, updateObjectUrlsFromThumbList,
  changeThumb, addDefaultThumbs } from '../actions';
import SortableThumbGrid from '../components/ThumbGrid';
import styles from '../components/Settings.css';
import { getLowestFrame, getHighestFrame, getChangeThumbStep, getVisibleThumbs } from '../utils/utils';

class SortedVisibleThumbGrid extends Component {

  componentDidMount() {
    console.log(this.props);
    const { store } = this.context;
    this.unsubscribe = store.subscribe(() => this.forceUpdate());
    store.getState().undoGroup.present.files.map((singleFile) => {
      if (store.getState().undoGroup.present.thumbsByFileId[singleFile.id] !== undefined) {
        store.dispatch(updateObjectUrlsFromThumbList(
          singleFile.id,
          Object.values(store.getState().undoGroup.present
            .thumbsByFileId[singleFile.id]
            .thumbs).map((a) => a.id)
        ));
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  onSortEnd = ({ oldIndex, newIndex }) => {
    const { store } = this.context;
    const newOrderedThumbs = arrayMove(store.getState().undoGroup.present
      .thumbsByFileId[store.getState().undoGroup.present.settings.currentFileId]
      .thumbs, oldIndex, newIndex);
    store.dispatch(updateOrder(store.getState()
      .undoGroup.present.settings.currentFileId, newOrderedThumbs));
  };

  render() {
    return (
      <Grid
        stretched
        verticalAlign="middle"
        padded="horizontally"
        style={{
          height: '100%',
          // position: 'absolute'
        }}
      >
        <Grid.Column
          key="2"
          width={16}
          className={this.props.editGrid ? styles.PaperLandscape : undefined}
          style={{
            // backgroundColor: 'gold',
          }}
        >
          <SortableThumbGrid
            editGrid={this.props.editGrid}
            thumbs={this.props.thumbs}
            thumbImages={this.props.thumbImages}
            file={this.props.file}
            settings={this.props.settings}
            // thumbWidth={this.props.settings.defaultThumbnailWidth}
            onToggleClick={this.props.onToggleClick}
            onRemoveClick={this.props.onRemoveClick}
            onInPointClick={this.props.onInPointClick}
            onOutPointClick={this.props.onOutPointClick}
            onBackClick={this.props.onBackClick}
            onForwardClick={this.props.onForwardClick}
            onScrubClick={this.props.onScrubClick}
            onMouseOverResult={(thumbId) => {
              this.controlersVisible = thumbId;
              this.forceUpdate();
            }}
            onMouseOutResult={() => {
              this.controlersVisible = 'false';
            }}
            onSortEnd={
              this.onSortEnd.bind(this)
            }
            useDragHandle
            axis="xy"
            controlersAreVisible={this.controlersVisible}

            columnCount={this.props.columnCount}
            thumbCount={this.props.thumbCount}
            reCapture={this.props.reCapture}
            moviePrintWidth={this.props.moviePrintWidth || 640}
            moviePrintHeight={this.props.moviePrintHeight || 360}
            containerWidth={this.props.containerWidth || 640}
            containerHeight={this.props.containerHeight || 360}
            zoomOut={this.props.zoomOut}
          />
        </Grid.Column>
      </Grid>
    );
  }
}

const mapStateToProps = state => {
  const tempThumbs = (typeof state.undoGroup.present
    .thumbsByFileId[state.undoGroup.present.settings.currentFileId] === 'undefined')
    ? undefined : state.undoGroup.present
      .thumbsByFileId[state.undoGroup.present.settings.currentFileId].thumbs;
  // console.log(tempThumbs);
  return {
    thumbs: getVisibleThumbs(
      tempThumbs,
      state.visibilitySettings.visibilityFilter
    ),
    thumbImages: (typeof state.thumbsObjUrls[state.undoGroup.present.settings.currentFileId] === 'undefined')
      ? undefined : state.thumbsObjUrls[state.undoGroup.present.settings.currentFileId],
    files: state.undoGroup.present.files,
    file: state.undoGroup.present.files.find((file) =>
      file.id === state.undoGroup.present.settings.currentFileId),
    settings: state.undoGroup.present.settings,
    visibilitySettings: state.visibilitySettings
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    onToggleClick: (fileId, thumbId) => {
      dispatch(toggleThumb(fileId, thumbId));
    },
    onRemoveClick: (fileId, thumbId) => {
      dispatch(removeThumb(fileId, thumbId));
    },
    onInPointClick: (file, thumbs, thumbId, frameNumber) => {
      dispatch(addDefaultThumbs(
        file,
        thumbs.length,
        frameNumber,
        getHighestFrame(thumbs)
      ));
    },
    onOutPointClick: (file, thumbs, thumbId, frameNumber) => {
      dispatch(addDefaultThumbs(
        file,
        thumbs.length,
        getLowestFrame(thumbs),
        frameNumber
      ));
    },
    onBackClick: (file, thumbId, frameNumber) => {
      dispatch(changeThumb(file, thumbId, frameNumber - getChangeThumbStep(1)));
    },
    onForwardClick: (file, thumbId, frameNumber) => {
      dispatch(changeThumb(file, thumbId, frameNumber + getChangeThumbStep(1)));
    },
    onScrubClick: (file, thumbId, frameNumber) => {
      ownProps.parentMethod(file, thumbId, frameNumber);
    }
  };
};

SortedVisibleThumbGrid.contextTypes = {
  store: PropTypes.object,
  // isManipulatingSliderInHeader: PropTypes.bool
};

export default connect(mapStateToProps, mapDispatchToProps)(SortedVisibleThumbGrid);
