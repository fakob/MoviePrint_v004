import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { arrayMove } from 'react-sortable-hoc';
import { toggleThumb, updateOrder, removeThumb, updateObjectUrlsFromThumbList,
  changeThumb, addDefaultThumbs } from '../actions';
import SortableThumbGrid from '../components/ThumbGrid';

function getLowestFrame(thumbs) {
  return thumbs.reduce(
    (min, p) => (p.frameNumber < min ? p.frameNumber : min),
    thumbs[0].frameNumber
  );
}
function getHighestFrame(thumbs) {
  return thumbs.reduce(
    (max, p) => (p.frameNumber > max ? p.frameNumber : max),
    thumbs[0].frameNumber
  );
}

function getChangeThumbStep(index) {
  const changeThumbStep = [1, 10, 100];
  return changeThumbStep[index];
}

const getVisibleThumbs = (thumbs, filter) => {
  if (thumbs === undefined) {
    return thumbs;
  }
  switch (filter) {
    case 'SHOW_ALL':
      return thumbs;
    case 'SHOW_HIDDEN':
      return thumbs.filter(t => t.hidden);
    case 'SHOW_VISIBLE':
      return thumbs.filter(t => !t.hidden);
    default:
      return thumbs;
  }
};

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
    // console.log(this.props.columnWidth);
    return (
      <SortableThumbGrid
        thumbs={this.props.thumbs}
        thumbImages={this.props.thumbImages}
        file={this.props.file}
        settings={this.props.settings}
        onToggleClick={this.props.onToggleClick}
        onRemoveClick={this.props.onRemoveClick}
        onInPointClick={this.props.onInPointClick}
        onOutPointClick={this.props.onOutPointClick}
        onBackClick={this.props.onBackClick}
        onForwardClick={this.props.onForwardClick}
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
        columnWidth={this.props.columnWidth}
        controlersAreVisible={this.controlersVisible}
      />
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
    thumbImages: state.thumbsObjUrls[state.undoGroup.present.settings.currentFileId],
    files: state.undoGroup.present.files,
    file: state.undoGroup.present.files.find((file) =>
      file.id === state.undoGroup.present.settings.currentFileId),
    settings: state.undoGroup.present.settings,
    visibilitySettings: state.visibilitySettings
  };
};

const mapDispatchToProps = dispatch => {
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
    }
  };
};

SortedVisibleThumbGrid.contextTypes = {
  store: PropTypes.object,
  // isManipulatingSliderInHeader: PropTypes.bool
};

export default connect(mapStateToProps, mapDispatchToProps)(SortedVisibleThumbGrid);
