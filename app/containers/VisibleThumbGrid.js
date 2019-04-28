import React, { Component } from 'react';
import path from 'path';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { arrayMove } from 'react-sortable-hoc';
import scrollIntoView from 'scroll-into-view';
import {
  toggleThumb, updateOrder,
  changeThumb, addIntervalSheet, setCurrentSheetId, setView, updateThumbObjectUrlFromDB
} from '../actions';
import styles from '../components/ThumbGrid.css';
import SortableThumbGrid from '../components/ThumbGrid';
import { getLowestFrame, getHighestFrame } from '../utils/utils';
import saveThumb from '../utils/saveThumb';
import { CHANGE_THUMB_STEP, SHEET_VIEW, DEFAULT_SHEET_SCENES } from '../utils/constants';

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
    if (prevProps.selectedThumbsArray.length !== 0 &&
      this.props.selectedThumbsArray.length !== 0 &&
      (prevProps.selectedThumbsArray[0].thumbId !== this.props.selectedThumbsArray[0].thumbId)) {
      this.scrollThumbIntoView();
    }
    // delay when switching to gridView so it waits for the sheetView to be ready
    if ((prevProps.view !== this.props.view) &&
    prevProps.view) {
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
      .sheetsByFileId[store.getState().undoGroup.present.settings.currentFileId][this.props.currentSheetId].thumbsArray,
      oldIndex,
      newIndex);
    store.dispatch(updateOrder(
      store.getState().undoGroup.present.settings.currentFileId,
      this.props.currentSheetId,
      newOrderedThumbs));
  };

  onSelectClick = (thumbId, frameNumber) => {
    this.props.onSelectThumbMethod(thumbId, frameNumber);
  }

  onErrorThumb = (file, sheetId, thumbId, frameId) => {
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
    const { isSorting } = this.state;
    const {
      colorArray,
      currentSheetId,
      file,
      inputRef,
      isGridView,
      keyObject,
      moviePrintWidth,
      objectUrlObjects,
      onAddThumbClick,
      onBackClick,
      onCutThumbClick,
      onExpandClick,
      onForwardClick,
      onInPointClick,
      onOutPointClick,
      onSaveThumbClick,
      onScrubClick,
      onThumbDoubleClick,
      onToggleClick,
      useBase64,
      scaleValueObject,
      selectedThumbsArray,
      settings,
      sheetType,
      sheetView,
      showSettings,
      thumbCount,
      thumbs,
      view,
      viewForPrinting
    } = this.props;

    return (
      <SortableThumbGrid
        useBase64={useBase64}
        colorArray={colorArray}
        sheetView={sheetView}
        sheetType={sheetType}
        view={view}
        currentSheetId={currentSheetId}
        file={file}
        inputRefThumb={this.scrollIntoViewElement} // for the thumb scrollIntoView function
        keyObject={keyObject}
        onAddThumbClick={onAddThumbClick}
        onCutThumbClick={onCutThumbClick}
        onBackClick={onBackClick}
        onForwardClick={onForwardClick}
        onInPointClick={onInPointClick}
        onOutPointClick={onOutPointClick}
        onSaveThumbClick={onSaveThumbClick}
        onScrubClick={onScrubClick}
        onSelectClick={this.onSelectClick}
        onErrorThumb={this.onErrorThumb}
        onExpandClick={onExpandClick}
        onThumbDoubleClick={onThumbDoubleClick}
        onToggleClick={onToggleClick}
        ref={inputRef} // for the saveMoviePrint function
        scaleValueObject={scaleValueObject}
        moviePrintWidth={moviePrintWidth}
        selectedThumbsArray={selectedThumbsArray}
        settings={settings}
        showSettings={showSettings}
        thumbCount={thumbCount}
        objectUrlObjects={objectUrlObjects}
        thumbs={thumbs}
        viewForPrinting={viewForPrinting}
        isGridView={isGridView}
        isSorting={isSorting}

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
    onSaveThumbClick: (filePath, fileUseRatio, fileName, frameNumber, frameId, transformObject) => {
      const filePathDirectory = path.dirname(filePath);
      const outputPath = ownProps.settings.defaultOutputPathFromMovie ? filePathDirectory : ownProps.settings.defaultOutputPath;
      saveThumb(filePath, fileUseRatio, fileName, frameNumber, frameId, outputPath, true, transformObject);
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
  thumbs: [],
  file: {},
  selectedThumbsArray: [],
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
  onCutThumbClick: PropTypes.func,
  onExpandClick: PropTypes.func,
  onThumbDoubleClick: PropTypes.func,
  onToggleClick: PropTypes.func.isRequired,
  scaleValueObject: PropTypes.object.isRequired,
  selectedThumbsArray: PropTypes.array,
  onSelectThumbMethod: PropTypes.func,
  settings: PropTypes.object.isRequired,
  sheetType: PropTypes.string.isRequired,
  sheetView: PropTypes.string.isRequired,
  // currentSheetId: PropTypes.string.isRequired,
  showSettings: PropTypes.bool.isRequired,
  thumbCount: PropTypes.number.isRequired,
  objectUrlObjects: PropTypes.object,
  thumbs: PropTypes.arrayOf(PropTypes.shape({
    thumbId: PropTypes.string.isRequired,
    index: PropTypes.number.isRequired,
    hidden: PropTypes.bool.isRequired,
    frameNumber: PropTypes.number.isRequired
  }).isRequired),
};

export default connect(mapStateToProps, mapDispatchToProps)(SortedVisibleThumbGrid);
