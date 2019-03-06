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
  getObjectProperty,
  // getWidthOfLongestRow,
  // formatBytes,
  // frameCountToTimeCode,
  // getLowestFrame,
  // getHighestFrame,
  // getAllFrameNumbers,
  // roundNumber,
} from './../utils/utils';
import {
  VIEW,
} from './../utils/constants';

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
    const minSceneLength = this.props.minSceneLength;
    const sceneArray = this.props.scenes;
    const thumbMarginTimeline = Math.floor(this.props.scaleValueObject.thumbMarginTimeline);
    // let rowCounter = 1;

    const rowHeight = this.props.scaleValueObject.newMoviePrintTimelineRowHeight;
    const realWidth = (rowHeight / this.props.scaleValueObject.aspectRatioInv);
    const newPixelPerFrameRatio = this.props.scaleValueObject.newMoviePrintTimelinePixelPerFrameRatio;
    const scenesInRows = this.props.scaleValueObject.scenesInRows;
    const indexRowArray = scenesInRows.map(item => item.index);
    // console.log(indexRowArray);

    return (
      <div
        data-tid='sceneGridDiv'
        className={styles.grid}
        id="SceneGrid"
        style={{
          marginLeft: this.props.view === VIEW.STANDARDVIEW ? undefined : '48px',
        }}
      >
        <div
          data-tid='sceneGridBodyDiv'
          style={{
            // width: newMaxWidth + realWidth, // enough width so when user selects thumb and it becomes wider, the row does not break into the next line
          }}
        >
          {sceneArray.map((scene, index) => {
            // minutes per row idea
            const selected = this.props.selectedSceneId ? (this.props.selectedSceneId === scene.sceneId) : false;
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
              doLineBreak={!this.props.settings.defaultTimelineViewFlow && doLineBreak}
              sheetView={this.props.sheetView}
              keyObject={this.props.keyObject}
              indexForId={index}
              index={index}
              key={scene.sceneId}
              sceneId={scene.sceneId}
              margin={thumbMarginTimeline}

              // only allow expanding of scenes which are not already large enough and deselecting
              allowSceneToBeSelected={selected || width < (realWidth * 0.95)}

              // use minimum value to make sure that scene does not disappear
              thumbWidth={Math.max(1, width)}
              thumbHeight={Math.max(1, rowHeight)}

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
              onExpand={(scene.sceneId !== this.state.controllersVisible) ?
                null : () => {
                  this.props.onExpandClick(this.props.file, scene.sceneId, this.props.currentSheetId);
                }}
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
