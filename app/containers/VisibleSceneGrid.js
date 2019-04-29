import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { arrayMove } from 'react-sortable-hoc';
import scrollIntoView from 'scroll-into-view';
import {
  toggleThumb, updateOrder,
  changeThumb, addIntervalSheet, toggleScene
} from '../actions';
import styles from '../components/ThumbGrid.css';
import SortableSceneGrid from '../components/SceneGrid';
import { getLowestFrame, getHighestFrame } from '../utils/utils';
import { CHANGE_THUMB_STEP } from '../utils/constants';

class SortedVisibleSceneGrid extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };

    this.scrollIntoViewElement = React.createRef();

    this.scrollThumbIntoView = this.scrollThumbIntoView.bind(this);
    this.onSelectClick = this.onSelectClick.bind(this);
    this.onDeselectClick = this.onDeselectClick.bind(this);
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
    this.unsubscribe();
  }

  onSortEnd = ({ oldIndex, newIndex }) => {
    const { store } = this.context;
    const newOrderedThumbs = arrayMove(store.getState().undoGroup.present
      .sheetsByFileId[store.getState().undoGroup.present.settings.currentFileId][store.getState().settings.currentSheetId].thumbsArray,
      oldIndex,
      newIndex);
    store.dispatch(updateOrder(
      store.getState().undoGroup.present.settings.currentFileId,
      store.getState().settings.currentSheetId,
      newOrderedThumbs));
  };

  onSelectClick = (sceneId, frameNumber) => {
    this.props.onSelectThumbMethod(sceneId, frameNumber);
  }

  onDeselectClick = () => {
    console.log('deselect')
    this.props.onDeselectThumbMethod();
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
    // const { store } = this.context;
    // const state = store.getState();
    return (
      <SortableSceneGrid
        useBase64={this.props.useBase64}
        sheetView={this.props.sheetView}
        view={this.props.view}
        sheetType={this.props.sheetType}
        currentSheetId={this.props.currentSheetId}
        file={this.props.file}
        inputRefThumb={this.scrollIntoViewElement} // for the thumb scrollIntoView function
        frameCount={this.props.file ? this.props.file.frameCount : undefined}
        keyObject={this.props.keyObject}
        onAddThumbClick={this.props.onAddThumbClick}
        onJumpToCutThumbClick={this.props.onJumpToCutThumbClick}
        onBackClick={this.props.onBackClick}
        onForwardClick={this.props.onForwardClick}
        onInPointClick={this.props.onInPointClick}
        onOutPointClick={this.props.onOutPointClick}
        onSaveThumbClick={this.props.onSaveThumbClick}
        onThumbDoubleClick={this.props.onThumbDoubleClick}
        onToggleSheetView={this.props.onToggleSheetView}
        onScrubClick={this.props.onScrubClick}
        onSelectClick={this.onSelectClick}
        onDeselectClick={this.onDeselectClick}
        onExpandClick={this.props.onExpandClick}
        onToggleClick={this.props.onToggleClick}
        minSceneLength={this.props.settings.defaultTimelineViewMinDisplaySceneLengthInFrames}
        scaleValueObject={this.props.scaleValueObject}
        scenes={this.props.scenes}
        selectedThumbsArray={this.props.selectedThumbsArray}
        settings={this.props.settings}
        showSettings={this.props.showSettings}
        thumbCount={this.props.thumbCount}
        objectUrlObjects={this.props.objectUrlObjects}
        thumbs={this.props.thumbs}

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
    onToggleClick: (fileId, sceneId) => {
      dispatch(toggleScene(fileId, ownProps.settings.currentSheetId, sceneId));
    },
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
