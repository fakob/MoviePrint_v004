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
import SortableThumbGrid from '../components/ThumbGrid';
import { getLowestFrame, getHighestFrame } from '../utils/utils';
import saveThumb from '../utils/saveThumb';
import { CHANGE_THUMB_STEP } from '../utils/constants';

class SortedVisibleThumbGrid extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };

    this.scrollIntoViewElement = React.createRef();

    this.scrollThumbIntoView = this.scrollThumbIntoView.bind(this);
    this.onSelectClick = this.onSelectClick.bind(this);
  }

  // componentDidMount() {
  componentWillMount() {
    // console.log(this.props);
    const { store } = this.context;
    this.unsubscribe = store.subscribe(() => this.forceUpdate());
    store.getState().undoGroup.present.files.map((singleFile) => {
      if (store.getState().undoGroup.present.thumbsByFileId[singleFile.id] !== undefined) {
        store.dispatch(updateObjectUrlsFromThumbList(
          singleFile.id,
          Object.values(store.getState().undoGroup.present
            .thumbsByFileId[singleFile.id]
            .thumbs).map((a) => a.frameId)
        ));
      }
      return true;
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.selectedThumbId !== this.props.selectedThumbId) {
      this.scrollThumbIntoView();
    }
    // delay when switching to thumbView so it waits for the view to be ready
    if ((prevProps.showMoviePrintView !== this.props.showMoviePrintView) &&
    prevProps.showMoviePrintView) {
      setTimeout(() => {
        this.scrollThumbIntoView();
      }, 500);
    }
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

  onSelectClick = (thumbId, frameNumber) => {
    this.props.selectMethod(thumbId, frameNumber);
  }

  scrollThumbIntoView = () => {
    if (this.scrollIntoViewElement && this.scrollIntoViewElement.current !== null) {
      // console.log(this.scrollIntoViewElement);
      scrollIntoView(this.scrollIntoViewElement.current, {
        time: 300,
        align: {
          left: 0.5,
        }
      });
    }
  };

  render() {
    // const { store } = this.context;
    // const state = store.getState();
    return (
      <SortableThumbGrid
        ref={this.props.inputRef} // for the saveMoviePrint function
        inputRefThumb={this.scrollIntoViewElement} // for the thumb scrollIntoView function
        showSettings={this.props.showSettings}
        colorArray={this.props.colorArray}
        thumbs={this.props.thumbs}
        thumbImages={this.props.thumbImages}
        settings={this.props.settings}
        visibilitySettings={this.props.visibilitySettings}
        file={this.props.file}
        selectedThumbId={this.props.selectedThumbId}
        thumbCount={this.props.thumbCount}
        showMoviePrintView={this.props.showMoviePrintView}
        scaleValueObject={this.props.scaleValueObject}
        keyObject={this.props.keyObject}

        onSelectClick={this.onSelectClick}
        onThumbDoubleClick={this.props.onThumbDoubleClick}
        onToggleClick={this.props.onToggleClick}
        onScrubClick={this.props.onScrubClick}
        onBackClick={this.props.onBackClick}
        onForwardClick={this.props.onForwardClick}
        onInPointClick={this.props.onInPointClick}
        onOutPointClick={this.props.onOutPointClick}
        onSaveThumbClick={this.props.onSaveThumbClick}

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
  // const tempThumbs = (state.undoGroup.present
  //   .thumbsByFileId[state.undoGroup.present.settings.currentFileId] === undefined)
  //   ? undefined : state.undoGroup.present
  //     .thumbsByFileId[state.undoGroup.present.settings.currentFileId].thumbs;
  return {
    // thumbs: getVisibleThumbs(
    //   tempThumbs,
    //   state.visibilitySettings.visibilityFilter
    // ),
    // thumbImages: (state.thumbsObjUrls[state.undoGroup.present.settings.currentFileId] === undefined)
    //   ? undefined : state.thumbsObjUrls[state.undoGroup.present.settings.currentFileId],
    // files: state.undoGroup.present.files,
    // file: state.undoGroup.present.files.find((file) =>
    //   file.id === state.undoGroup.present.settings.currentFileId),
    // settings: state.undoGroup.present.settings,
    // visibilitySettings: state.visibilitySettings
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    onToggleClick: (fileId, thumbId) => {
      dispatch(toggleThumb(fileId, thumbId));
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
    onSaveThumbClick: (fileName, frameNumber, frameId) => {
      saveThumb(fileName, frameNumber, frameId);
    },
    onBackClick: (file, thumbId, frameNumber) => {
      const [stepValue0, stepValue1, stepValue2] = CHANGE_THUMB_STEP;
      let stepValue = stepValue1;
      if (ownProps.keyObject.shiftKey) {
        stepValue = stepValue0;
      }
      if (ownProps.keyObject.altKey) {
        stepValue = stepValue2;
      }
      dispatch(changeThumb(file, thumbId, frameNumber - stepValue));
    },
    onForwardClick: (file, thumbId, frameNumber) => {
      const [stepValue0, stepValue1, stepValue2] = CHANGE_THUMB_STEP;
      let stepValue = stepValue1;
      if (ownProps.keyObject.shiftKey) {
        stepValue = stepValue0;
      }
      if (ownProps.keyObject.altKey) {
        stepValue = stepValue2;
      }
      dispatch(changeThumb(file, thumbId, frameNumber + stepValue));
    }
  };
};

SortedVisibleThumbGrid.contextTypes = {
  store: PropTypes.object,
};

SortedVisibleThumbGrid.defaultProps = {
  thumbs: [],
  file: {}
};

SortedVisibleThumbGrid.propTypes = {
  colorArray: PropTypes.array.isRequired,
  file: PropTypes.shape({
    id: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
  }),
  inputRef: PropTypes.func.isRequired,
  keyObject: PropTypes.object.isRequired,
  onBackClick: PropTypes.func.isRequired,
  onForwardClick: PropTypes.func.isRequired,
  onInPointClick: PropTypes.func.isRequired,
  onOutPointClick: PropTypes.func.isRequired,
  onSaveThumbClick: PropTypes.func.isRequired,
  onScrubClick: PropTypes.func,
  onThumbDoubleClick: PropTypes.func,
  onToggleClick: PropTypes.func.isRequired,
  scaleValueObject: PropTypes.object.isRequired,
  selectedThumbId: PropTypes.string,
  selectMethod: PropTypes.func,
  settings: PropTypes.object.isRequired,
  showMoviePrintView: PropTypes.bool.isRequired,
  showSettings: PropTypes.bool.isRequired,
  thumbCount: PropTypes.number.isRequired,
  thumbImages: PropTypes.object,
  thumbs: PropTypes.arrayOf(PropTypes.shape({
    thumbId: PropTypes.string.isRequired,
    index: PropTypes.number.isRequired,
    hidden: PropTypes.bool.isRequired,
    frameNumber: PropTypes.number.isRequired
  }).isRequired),
};

export default connect(mapStateToProps, mapDispatchToProps)(SortedVisibleThumbGrid);
