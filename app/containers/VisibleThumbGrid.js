import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { arrayMove } from 'react-sortable-hoc';
import scrollIntoView from 'scroll-into-view';
import {
  toggleThumb, updateOrder,
  changeThumb, addDefaultThumbs, setSheet, setView, updateThumbObjectUrlFromDB
} from '../actions';
import styles from '../components/ThumbGrid.css';
import SortableThumbGrid from '../components/ThumbGrid';
import { getLowestFrame, getHighestFrame } from '../utils/utils';
import saveThumb from '../utils/saveThumb';
import { CHANGE_THUMB_STEP, VIEW, DEFAULT_SHEET_SCENES } from '../utils/constants';

class SortedVisibleThumbGrid extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isSorting: false,
    };

    this.scrollIntoViewElement = React.createRef();

    this.scrollThumbIntoView = this.scrollThumbIntoView.bind(this);
    this.onSelectClick = this.onSelectClick.bind(this);
    this.onErrorThumb = this.onErrorThumb.bind(this);
  }

  // componentDidMount() {
  componentWillMount() {
  }

  componentDidUpdate(prevProps) {
    if (prevProps.selectedThumbId !== this.props.selectedThumbId) {
      this.scrollThumbIntoView();
    }
    // delay when switching to gridView so it waits for the view to be ready
    if ((prevProps.defaultView !== this.props.defaultView) &&
    prevProps.defaultView) {
      setTimeout(() => {
        this.scrollThumbIntoView();
      }, 500);
    }
  }

  componentWillUnmount() {
    // this.unsubscribe();
  }

  onSortStart = () => {
    this.setState({
      isSorting: true,
    });
  };

  onSortEnd = ({ oldIndex, newIndex }) => {
    const { store } = this.context;
    this.setState({
      isSorting: false,
    });
    const newOrderedThumbs = arrayMove(store.getState().undoGroup.present
      .thumbsByFileId[store.getState().undoGroup.present.settings.currentFileId][this.props.defaultSheet],
      oldIndex,
      newIndex);
    store.dispatch(updateOrder(
      store.getState().undoGroup.present.settings.currentFileId,
      this.props.defaultSheet,
      newOrderedThumbs));
  };

  onSelectClick = (thumbId, frameNumber) => {
    this.props.selectThumbMethod(thumbId, frameNumber);
  }

  onErrorThumb = (file, sheet, thumbId, frameId) => {
    const { store } = this.context;
    console.log('inside onErrorThumb');
    // onErrorThumb seems to slow things down quite a bit, maybe because it is called multiple times?
  }

  scrollThumbIntoView = () => {
    if (this.scrollIntoViewElement && this.scrollIntoViewElement.current !== null) {
      scrollIntoView(this.scrollIntoViewElement.current, {
        time: 300,
        align: {
          left: 0.5,
        }
      });
    }
  };

  render() {
    return (
      <SortableThumbGrid
        colorArray={this.props.colorArray}
        defaultView={this.props.defaultView}
        defaultSheet={this.props.defaultSheet}
        file={this.props.file}
        inputRefThumb={this.scrollIntoViewElement} // for the thumb scrollIntoView function
        keyObject={this.props.keyObject}
        onAddThumbClick={this.props.onAddThumbClick}
        onBackClick={this.props.onBackClick}
        onForwardClick={this.props.onForwardClick}
        onInPointClick={this.props.onInPointClick}
        onOutPointClick={this.props.onOutPointClick}
        onSaveThumbClick={this.props.onSaveThumbClick}
        onScrubClick={this.props.onScrubClick}
        onSelectClick={this.onSelectClick}
        onErrorThumb={this.onErrorThumb}
        onExitClick={this.props.onExitClick}
        onThumbDoubleClick={this.props.onThumbDoubleClick}
        onToggleClick={this.props.onToggleClick}
        ref={this.props.inputRef} // for the saveMoviePrint function
        scaleValueObject={this.props.scaleValueObject}
        moviePrintWidth={this.props.moviePrintWidth}
        selectedThumbId={this.props.selectedThumbId}
        settings={this.props.settings}
        showSettings={this.props.showSettings}
        thumbCount={this.props.thumbCount}
        thumbImages={this.props.thumbImages}
        thumbs={this.props.thumbs}
        viewForPrinting={this.props.viewForPrinting}
        visibilitySettings={this.props.visibilitySettings}
        isSorting={this.state.isSorting}

        useDragHandle
        axis="xy"
        distance={1}
        helperClass={styles.whileDragging}
        useWindowAsScrollContainer
        onSortStart={
          this.onSortStart.bind(this)
        }
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
    onExitClick: () => {
      dispatch(setSheet(DEFAULT_SHEET_SCENES));
      dispatch(setView(VIEW.TIMELINEVIEW));
    },
    onToggleClick: (fileId, thumbId) => {
      dispatch(toggleThumb(fileId, ownProps.defaultSheet, thumbId));
    },
    onInPointClick: (file, thumbs, thumbId, frameNumber) => {
      dispatch(addDefaultThumbs(
        file,
        ownProps.defaultSheet,
        thumbs.length,
        frameNumber,
        getHighestFrame(thumbs),
        ownProps.frameScale,
      ));
    },
    onOutPointClick: (file, thumbs, thumbId, frameNumber) => {
      dispatch(addDefaultThumbs(
        file,
        ownProps.defaultSheet,
        thumbs.length,
        getLowestFrame(thumbs),
        frameNumber,
        ownProps.frameScale,
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
      dispatch(changeThumb(ownProps.defaultSheet, file, thumbId, frameNumber - stepValue, ownProps.frameScale));
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
      dispatch(changeThumb(ownProps.defaultSheet, file, thumbId, frameNumber + stepValue, ownProps.frameScale));
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
  onAddThumbClick: PropTypes.func,
  onThumbDoubleClick: PropTypes.func,
  onToggleClick: PropTypes.func.isRequired,
  scaleValueObject: PropTypes.object.isRequired,
  selectedThumbId: PropTypes.string,
  selectThumbMethod: PropTypes.func,
  settings: PropTypes.object.isRequired,
  defaultView: PropTypes.string.isRequired,
  defaultSheet: PropTypes.string.isRequired,
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
