import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { arrayMove } from 'react-sortable-hoc';
import scrollIntoView from 'scroll-into-view';
import {
  toggleThumb, updateOrder, updateObjectUrlsFromThumbList,
  changeThumb, addDefaultThumbs
} from '../actions';
import styles from '../components/ThumbGrid.css';
import SortableSceneGrid from '../components/SceneGrid';
import { getLowestFrame, getHighestFrame } from '../utils/utils';
import saveThumb from '../utils/saveThumb';
import { CHANGE_THUMB_STEP } from '../utils/constants';

class SortedVisibleSceneGrid extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };

    // this.onSelectClick = this.onSelectClick.bind(this);
  }

  // componentDidMount() {
  componentWillMount() {
    const { store } = this.context;
    this.unsubscribe = store.subscribe(() => this.forceUpdate());

    // only updateObjectUrlsFromThumbList if thumbs exist
      store.getState().undoGroup.present.files.map((singleFile) => {
        if (store.getState().undoGroup.present.thumbsByFileId[singleFile.id] !== undefined
          && store.getState().undoGroup.present.thumbsByFileId[singleFile.id][store.getState().visibilitySettings.defaultSheet] !== undefined) {
          store.dispatch(updateObjectUrlsFromThumbList(
            singleFile.id,
            store.getState().visibilitySettings.defaultSheet,
            Object.values(store.getState().undoGroup.present
            .thumbsByFileId[singleFile.id][store.getState().visibilitySettings.defaultSheet])
            .map((a) => a.frameId)
          ));
        }
        return true;
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  onSortEnd = ({ oldIndex, newIndex }) => {
    const { store } = this.context;
    const newOrderedThumbs = arrayMove(store.getState().undoGroup.present
      .thumbsByFileId[store.getState().undoGroup.present.settings.currentFileId][store.getState().visibilitySettings.defaultSheet],
      oldIndex,
      newIndex);
    store.dispatch(updateOrder(
      store.getState().undoGroup.present.settings.currentFileId,
      store.getState().visibilitySettings.defaultSheet,
      newOrderedThumbs));
  };

  // onSelectClick = (file, sceneId) => {
  //   console.log(file);
  //   console.log(sceneId);
  // }

  render() {
    // const { store } = this.context;
    // const state = store.getState();
    return (
      <SortableSceneGrid
        defaultView={this.props.defaultView}
        file={this.props.file}
        frameCount={this.props.file ? this.props.file.frameCount : undefined}
        keyObject={this.props.keyObject}
        onAddThumbClick={this.props.onAddThumbClick}
        onBackClick={this.props.onBackClick}
        onForwardClick={this.props.onForwardClick}
        onInPointClick={this.props.onInPointClick}
        onOutPointClick={this.props.onOutPointClick}
        onSaveThumbClick={this.props.onSaveThumbClick}
        onSceneThumbDoubleClick={this.props.onSceneThumbDoubleClick}
        onScrubClick={this.props.onScrubClick}
        // onSelectClick={this.props.onSelectClick}
        onEnterClick={this.props.onEnterClick}
        onToggleClick={this.props.onToggleClick}
        rowCount={this.props.settings.defaultSceneDetectionRowCount}
        scaleValueObject={this.props.scaleValueObject}
        scenes={this.props.scenes}
        selectedThumbId={this.props.selectedThumbId}
        settings={this.props.settings}
        showSettings={this.props.showSettings}
        thumbCount={this.props.thumbCount}
        thumbImages={this.props.thumbImages}
        thumbs={this.props.thumbs}
        visibilitySettings={this.props.visibilitySettings}

        useDragHandle
        axis="xy"
        distance={1}
        helperClass={styles.whileDragging}
        useWindowAsScrollContainer
        onSortEnd={
          this.onSortEnd.bind(this)
        }
      />
    );
  }
}

const mapStateToProps = state => {
  return {
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    // onToggleClick: (fileId, thumbId) => {
    //   dispatch(toggleThumb(fileId, ownProps.visibilitySettings.defaultSheet, thumbId));
    // },
    // onInPointClick: (file, thumbs, thumbId, frameNumber) => {
    //   dispatch(addDefaultThumbs(
    //     file,
    //     ownProps.visibilitySettings.defaultSheet,
    //     thumbs.length,
    //     frameNumber,
    //     getHighestFrame(thumbs)
    //   ));
    // },
    // onOutPointClick: (file, thumbs, thumbId, frameNumber) => {
    //   dispatch(addDefaultThumbs(
    //     file,
    //     ownProps.visibilitySettings.defaultSheet,
    //     thumbs.length,
    //     getLowestFrame(thumbs),
    //     frameNumber
    //   ));
    // },
    // onSaveThumbClick: (fileName, frameNumber, frameId) => {
    //   saveThumb(fileName, frameNumber, frameId);
    // },
    // onBackClick: (file, thumbId, frameNumber) => {
    //   const [stepValue0, stepValue1, stepValue2] = CHANGE_THUMB_STEP;
    //   let stepValue = stepValue1;
    //   if (ownProps.keyObject.shiftKey) {
    //     stepValue = stepValue0;
    //   }
    //   if (ownProps.keyObject.altKey) {
    //     stepValue = stepValue2;
    //   }
    //   dispatch(changeThumb(ownProps.visibilitySettings.defaultSheet, file, thumbId, frameNumber - stepValue));
    // },
    // onForwardClick: (file, thumbId, frameNumber) => {
    //   const [stepValue0, stepValue1, stepValue2] = CHANGE_THUMB_STEP;
    //   let stepValue = stepValue1;
    //   if (ownProps.keyObject.shiftKey) {
    //     stepValue = stepValue0;
    //   }
    //   if (ownProps.keyObject.altKey) {
    //     stepValue = stepValue2;
    //   }
    //   dispatch(changeThumb(ownProps.visibilitySettings.defaultSheet, file, thumbId, frameNumber + stepValue));
    // }
  };
};

SortedVisibleSceneGrid.contextTypes = {
  store: PropTypes.object,
};

SortedVisibleSceneGrid.defaultProps = {
};

SortedVisibleSceneGrid.propTypes = {
};

export default connect(mapStateToProps, mapDispatchToProps)(SortedVisibleSceneGrid);
