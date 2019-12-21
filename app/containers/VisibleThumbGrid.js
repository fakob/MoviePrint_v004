import React, { Component } from 'react';
import path from 'path';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { arrayMove } from 'react-sortable-hoc';
import scrollIntoView from 'scroll-into-view';
import {
  toggleThumb, updateOrder,
  changeThumb, addIntervalSheet, toggleThumbArray
} from '../actions';
import styles from '../components/ThumbGrid.css';
import SortableThumbGrid from '../components/ThumbGrid';
import { getLowestFrame, getHighestFrame } from '../utils/utils';
import saveThumb from '../utils/saveThumb';
import {
  CHANGE_THUMB_STEP,
  DEFAULT_SINGLETHUMB_NAME,
} from '../utils/constants';

class SortedVisibleThumbGrid extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isSorting: false,
    };

    this.scrollIntoViewElement = React.createRef();

    this.scrollThumbIntoView = this.scrollThumbIntoView.bind(this);
    this.onSelectClick = this.onSelectClick.bind(this);
  }

  componentWillMount() {
    const { store } = this.context;
    this.unsubscribe = store.subscribe(() => this.forceUpdate());
  }

  componentDidMount() {
    setTimeout(() => {
      this.scrollThumbIntoView();
    }, 500);
  }

  componentDidUpdate(prevProps) {
    const { selectedThumbsArray, view } = this.props;

    if (prevProps.selectedThumbsArray.length !== 0 &&
      selectedThumbsArray.length !== 0 &&
      (prevProps.selectedThumbsArray[0].thumbId !== selectedThumbsArray[0].thumbId)) {
      this.scrollThumbIntoView();
    }
    // delay when switching to gridView so it waits for the sheetView to be ready
    if ((prevProps.view !== view) &&
    prevProps.view) {
      setTimeout(() => {
        this.scrollThumbIntoView();
      }, 500);
    }
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  onSortStart = () => {
    this.setState({
      isSorting: true,
    });
  };

  onSortEnd = ({ oldIndex, newIndex }) => {
    const { store } = this.context;
    const { currentSheetId } = this.props;

    this.setState({
      isSorting: false,
    });
    const newOrderedThumbs = arrayMove(store.getState().undoGroup.present
      .sheetsByFileId[store.getState().undoGroup.present.settings.currentFileId][currentSheetId].thumbsArray,
      oldIndex,
      newIndex);
    store.dispatch(updateOrder(
      store.getState().undoGroup.present.settings.currentFileId,
      currentSheetId,
      newOrderedThumbs));
  };

  onSelectClick = (thumbId, frameNumber) => {
    const { onSelectThumbMethod } = this.props;

    onSelectThumbMethod(thumbId, frameNumber);
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
    const { isSorting } = this.state;
    const {
      currentSheetId,
      defaultShowDetailsInHeader,
      defaultShowHeader,
      defaultShowImages,
      defaultShowPathInHeader,
      defaultShowTimelineInHeader,
      defaultThumbInfo,
      defaultThumbInfoRatio,
      emptyColorsArray,
      file,
      inputRef,
      isGridView,
      isViewForPrinting,
      keyObject,
      moviePrintWidth,
      objectUrlObjects,
      onAddThumbClick,
      onBackClick,
      onExpandClick,
      onForwardClick,
      onHideBeforeAfterClick,
      onInPointClick,
      onJumpToCutThumbClick,
      onOutPointClick,
      onSaveThumbClick,
      onScrubClick,
      onThumbDoubleClick,
      onToggleClick,
      scaleValueObject,
      selectedThumbsArray,
      settings,
      sheetType,
      sheetView,
      showMovielist,
      showSettings,
      thumbCount,
      thumbs,
      useBase64,
      view,
    } = this.props;

    return (
      <SortableThumbGrid
        useBase64={useBase64}
        emptyColorsArray={emptyColorsArray}
        sheetView={sheetView}
        sheetType={sheetType}
        view={view}
        currentSheetId={currentSheetId}
        settings={settings}
        file={file}
        inputRefThumb={this.scrollIntoViewElement} // for the thumb scrollIntoView function
        keyObject={keyObject}
        onAddThumbClick={onAddThumbClick}
        onJumpToCutThumbClick={onJumpToCutThumbClick}
        onBackClick={onBackClick}
        onForwardClick={onForwardClick}
        onInPointClick={onInPointClick}
        onOutPointClick={onOutPointClick}
        onHideBeforeAfterClick={onHideBeforeAfterClick}
        onSaveThumbClick={onSaveThumbClick}
        onScrubClick={onScrubClick}
        onSelectClick={this.onSelectClick}
        onExpandClick={onExpandClick}
        onThumbDoubleClick={onThumbDoubleClick}
        onToggleClick={onToggleClick}
        ref={inputRef} // for the saveMoviePrint function
        scaleValueObject={scaleValueObject}
        moviePrintWidth={moviePrintWidth}
        selectedThumbsArray={selectedThumbsArray}
        defaultShowDetailsInHeader={defaultShowDetailsInHeader}
        defaultShowHeader={defaultShowHeader}
        defaultShowImages={defaultShowImages}
        defaultShowPathInHeader={defaultShowPathInHeader}
        defaultShowTimelineInHeader={defaultShowTimelineInHeader}
        defaultThumbInfo={defaultThumbInfo}
        defaultThumbInfoRatio={defaultThumbInfoRatio}
        showMovielist={showMovielist}
        showSettings={showSettings}
        thumbCount={thumbCount}
        objectUrlObjects={objectUrlObjects}
        thumbs={thumbs}
        isViewForPrinting={isViewForPrinting}
        isGridView={isGridView}
        isSorting={isSorting}

        useDragHandle
        axis="xy"
        distance={1}
        helperClass={styles.whileDragging}
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

const mapStateToProps = (state) => {
  // const tempThumbs = (state.undoGroup.present
  //   .sheetsByFileId[state.undoGroup.present.settings.currentFileId] === undefined)
  //   ? undefined : state.undoGroup.present
  //     .sheetsByFileId[state.undoGroup.present.settings.currentFileId].thumbs;
  return {
    // thumbs: getVisibleThumbs(
    //   tempThumbs,
    //   state.visibilitySettings.visibilityFilter
    // ),
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
      dispatch(toggleThumb(fileId, ownProps.currentSheetId, thumbId));
    },
    onInPointClick: (file, thumbs, thumbId, frameNumber) => {
      dispatch(addIntervalSheet(
        file,
        ownProps.currentSheetId,
        thumbs.length,
        frameNumber,
        getHighestFrame(thumbs),
        ownProps.frameSize,
      ));
    },
    onOutPointClick: (file, thumbs, thumbId, frameNumber) => {
      dispatch(addIntervalSheet(
        file,
        ownProps.currentSheetId,
        thumbs.length,
        getLowestFrame(thumbs),
        frameNumber,
        ownProps.frameSize,
      ));
    },
    onHideBeforeAfterClick: (fileId, sheetId, thumbIdArray) => {
      dispatch(toggleThumbArray(
        fileId,
        sheetId,
        thumbIdArray
      ));
    },

    onSaveThumbClick: (filePath, fileUseRatio, movieFileName, frameNumber, frameId, transformObject) => {
      const filePathDirectory = path.dirname(filePath);
      const outputPath = ownProps.defaultOutputPathFromMovie ? filePathDirectory : ownProps.defaultOutputPath;
      saveThumb(filePath, fileUseRatio, movieFileName, frameNumber, ownProps.settings.defaultSingleThumbName || DEFAULT_SINGLETHUMB_NAME, frameId, outputPath, true, transformObject);
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
      dispatch(changeThumb(ownProps.currentSheetId, file, thumbId, frameNumber - stepValue, ownProps.frameSize));
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
      dispatch(changeThumb(ownProps.currentSheetId, file, thumbId, frameNumber + stepValue, ownProps.frameSize));
    }
  };
};

SortedVisibleThumbGrid.contextTypes = {
  store: PropTypes.object,
};

SortedVisibleThumbGrid.defaultProps = {
  currentSheetId: undefined,
  file: {},
  selectedThumbsArray: [],
  thumbs: [],
  useBase64: undefined,
};

SortedVisibleThumbGrid.propTypes = {
  file: PropTypes.shape({
    id: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
  }),
  thumbs: PropTypes.arrayOf(PropTypes.shape({
    thumbId: PropTypes.string.isRequired,
    index: PropTypes.number.isRequired,
    hidden: PropTypes.bool.isRequired,
    frameNumber: PropTypes.number.isRequired
  }).isRequired),
  currentSheetId: PropTypes.string,
  emptyColorsArray: PropTypes.array.isRequired,
  inputRef: PropTypes.func.isRequired,
  isGridView: PropTypes.bool.isRequired,
  defaultOutputPath: PropTypes.string,
  defaultOutputPathFromMovie: PropTypes.bool,
  defaultShowDetailsInHeader: PropTypes.bool,
  defaultShowHeader: PropTypes.bool,
  defaultShowImages: PropTypes.bool,
  defaultShowPathInHeader: PropTypes.bool,
  defaultShowTimelineInHeader: PropTypes.bool,
  defaultThumbInfo: PropTypes.string,
  defaultThumbInfoRatio: PropTypes.number,
  isViewForPrinting: PropTypes.bool.isRequired,
  keyObject: PropTypes.object.isRequired,
  moviePrintWidth: PropTypes.number.isRequired,
  objectUrlObjects: PropTypes.object,
  onAddThumbClick: PropTypes.func,
  onBackClick: PropTypes.func.isRequired,
  onExpandClick: PropTypes.func,
  onForwardClick: PropTypes.func.isRequired,
  onHideBeforeAfterClick: PropTypes.func.isRequired,
  onInPointClick: PropTypes.func.isRequired,
  onJumpToCutThumbClick: PropTypes.func,
  onOutPointClick: PropTypes.func.isRequired,
  onSaveThumbClick: PropTypes.func.isRequired,
  onScrubClick: PropTypes.func,
  onSelectThumbMethod: PropTypes.func,
  onThumbDoubleClick: PropTypes.func,
  onToggleClick: PropTypes.func.isRequired,
  scaleValueObject: PropTypes.object.isRequired,
  selectedThumbsArray: PropTypes.array,
  sheetType: PropTypes.string.isRequired,
  sheetView: PropTypes.string.isRequired,
  showMovielist: PropTypes.bool.isRequired,
  showSettings: PropTypes.bool.isRequired,
  thumbCount: PropTypes.number.isRequired,
  useBase64: PropTypes.bool,
  view: PropTypes.string.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(SortedVisibleThumbGrid);
