// @flow

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import Scene from './Scene';
import styles from './SceneGrid.css';
import {
  // getNextThumbs,
  // getPreviousThumbs,
  // mapRange,
  getWidthOfSingleRow,
  // getWidthOfLongestRow,
  // formatBytes,
  // frameCountToTimeCode,
  // getLowestFrame,
  // getHighestFrame,
  // getAllFrameNumbers,
  // roundNumber,
} from '../utils/utils';
import {
  CUTPLAYER_SCENE_MARGIN,
  VIEW,
} from '../utils/constants';

const SortableScene = SortableElement(Scene);

class SceneGrid extends Component {
  constructor(props) {
    super(props);

    this.state = {
      thumbsToDim: [],
      controllersVisible: undefined,
      addThumbBeforeController: undefined,
      addThumbAfterController: undefined,
    };
  }

  componentWillMount() {
  }

  componentDidMount() {
  }

  componentWillReceiveProps(nextProps) {
  }

  componentDidUpdate(prevProps) {
  }

  render() {
    const { minSceneLength, scaleValueObject, scenes, selectedThumbsArray, settings, view } = this.props;

    const isPlayerView = view !== VIEW.STANDARDVIEW;
    const breakOnWidth = isPlayerView || settings.defaultTimelineViewFlow;

    const thumbMarginTimeline = isPlayerView ? CUTPLAYER_SCENE_MARGIN : Math.floor(scaleValueObject.thumbMarginTimeline);

    const rowHeight = scaleValueObject.newMoviePrintTimelineRowHeight;
    const rowHeightForPlayer = ((scaleValueObject.videoPlayerHeight / 2) - (settings.defaultBorderMargin * 3));

    const realWidth = (rowHeight / scaleValueObject.aspectRatioInv);
    const newPixelPerFrameRatio = scaleValueObject.newMoviePrintTimelinePixelPerFrameRatio;
    const scenesInRows = scaleValueObject.scenesInRows;
    const indexRowArray = scenesInRows.map(item => item.index);
    // console.log(indexRowArray);

    // for CutPlayer
    const widthOfSingleRow = getWidthOfSingleRow(scenesInRows, thumbMarginTimeline, newPixelPerFrameRatio, minSceneLength);

    return (
      <div
        data-tid='sceneGridDiv'
        className={styles.grid}
        id="SceneGrid"
        style={{
          // marginLeft: isPlayerView ? '48px' : undefined,
        }}
      >
        <div
          data-tid='sceneGridBodyDiv'
          style={{
            width: isPlayerView ? widthOfSingleRow : undefined, // if CutPlayer then single row
          }}
        >
          {scenes.map((scene, index) => {
            // minutes per row idea
            const selected = selectedThumbsArray.length > 0 ? selectedThumbsArray.some(item => item.thumbId === scene.sceneId) : false;
            const width = selected ? realWidth :
              Math.max(newPixelPerFrameRatio * scene.length, newPixelPerFrameRatio * minSceneLength);
            let doLineBreak = false;
            if (indexRowArray.findIndex(item => item === index - 1) > -1) {
              doLineBreak = true;
              // rowCounter += 1;
            }

            const thumb = this.props.thumbs.find((foundThumb) => foundThumb.thumbId === scene.sceneId);

            return (
            <SortableScene
              hidden={scene.hidden}
              controllersAreVisible={(scene.sceneId === undefined) ? false : (scene.sceneId === this.state.controllersVisible)}
              selected={selected}
              doLineBreak={!breakOnWidth && doLineBreak}
              sheetView={this.props.sheetView}
              view={view}
              keyObject={this.props.keyObject}
              indexForId={index}
              index={index}
              key={scene.sceneId}
              sceneId={scene.sceneId}
              margin={thumbMarginTimeline}

              // only allow expanding of scenes which are not already large enough and deselecting
              allowSceneToBeSelected={isPlayerView || selected || width < (realWidth * 0.95)}

              // use minimum value to make sure that scene does not disappear
              thumbWidth={Math.max(1, width)}
              thumbHeight={isPlayerView ? rowHeightForPlayer : Math.max(1, rowHeight)}

              hexColor={`#${((1 << 24) + (Math.round(scene.colorArray[0]) << 16) + (Math.round(scene.colorArray[1]) << 8) + Math.round(scene.colorArray[2])).toString(16).slice(1)}`}
              thumbImageObjectUrl={ // used for data stored in IndexedDB
                ((this.props.useBase64 === undefined &&
                  this.props.objectUrlObjects !== undefined &&
                  thumb !== undefined) ?
                  this.props.objectUrlObjects[thumb.frameId] : undefined)
              }
              base64={ // used for live captured data when saving movieprint
                ((this.props.useBase64 !== undefined &&
                  this.props.objectUrlObjects !== undefined &&
                  thumb !== undefined) ?
                  this.props.objectUrlObjects[thumb.frameId] : undefined)
              }


              onOver={() => {
                // only setState if controllersVisible has changed
                if (this.state.controllersVisible !== scene.sceneId) {
                  this.setState({
                    controllersVisible: scene.sceneId,
                  });
                }
              }}
              onOut={() => {
                this.setState({
                  thumbsToDim: [],
                  controllersVisible: undefined,
                  addThumbBeforeController: undefined,
                  addThumbAfterController: undefined,
                });
              }}
              onThumbDoubleClick={this.props.onThumbDoubleClick}
              onToggle={(scene.sceneId !== this.state.controllersVisible) ?
                null : () => this.props.onToggleClick(this.props.file.id, scene.sceneId)}
              onSelect={(scene.sceneId !== this.state.controllersVisible) ?
                null : () => {
                  this.props.onSelectClick(scene.sceneId);
                }}
              onCutBefore={(scene.sceneId !== this.state.controllersVisible) ?
                null : () => {
                  this.props.onCutThumbClick(this.props.file, scene.sceneId, 'before');
                }}
              onCutAfter={(scene.sceneId !== this.state.controllersVisible) ?
                null : () => {
                  this.props.onCutThumbClick(this.props.file, scene.sceneId, 'after');
                }}
              onExpand={(scene.sceneId !== this.state.controllersVisible) ?
                null : () => {
                  this.props.onExpandClick(this.props.file, scene.sceneId, this.props.currentSheetId);
                }}
              inputRefThumb={(this.props.selectedThumbsArray.length !== 0 && this.props.selectedThumbsArray[0].thumbId === scene.sceneId) ?
                this.props.inputRefThumb : undefined} // for the thumb scrollIntoView function
            />)}
          )}
        </div>
      </div>
    );
  }
}

SceneGrid.defaultProps = {
};

SceneGrid.propTypes = {
};

const SortableSceneGrid = SortableContainer(SceneGrid);

export default SortableSceneGrid;
