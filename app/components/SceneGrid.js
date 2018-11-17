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
  // getThumbInfoValue,
  // formatBytes,
  // frameCountToTimeCode,
  // getLowestFrame,
  // getHighestFrame,
  // getAllFrameNumbers,
  // roundNumber,
} from './../utils/utils';
import {
  // MINIMUM_WIDTH_OF_CUTWIDTH_ON_TIMELINE,
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
    const minutesPerRow = this.props.minutesPerRow;
    const sceneArray = this.props.scenes;
    const safetyMargin = 0;
    let lineCounter = 1;
    // const frameWidthInPixel =
    const rows = Math.ceil(this.props.frameCount / (minutesPerRow * 60 * 25 * 1.0));

    // calculate width through getting longest row
    const pixelPerFrameRatio = (this.props.scaleValueObject.containerWidth - safetyMargin) / (minutesPerRow * 60 * 25 * 1.0);
    let rowCounter = 1;
    let lastRowLength = 0;
    let lastRowItemCount = -1; // compensate for index starting at 0;
    const rowArray = [];
    const temp = sceneArray.map((scene, index, array) => {
      const sceneOutPoint = scene.start + scene.length;
      if (sceneArray.length !== index + 1) {
        if ((sceneOutPoint) > (minutesPerRow * 60 * 25 * rowCounter)) {
          const previousIndex = index - 1;
          const previousSceneOutPoint = array[previousIndex].start + array[previousIndex].length;
          const rowItemCount = previousIndex - lastRowItemCount;
          const rowLength = previousSceneOutPoint - lastRowLength;
          const rowWidth = rowLength * pixelPerFrameRatio + this.props.scaleValueObject.newThumbMargin * 2 * rowItemCount;
          rowArray.push({
            index: previousIndex,
            sceneOutPoint: previousSceneOutPoint,
            rowItemCount,
            rowLength,
            rowWidth,
          });
          lastRowItemCount = previousIndex;
          lastRowLength = previousSceneOutPoint;
          rowCounter += 1;
        }
      } else { // last item
        const rowLength = sceneOutPoint - lastRowLength;
        const rowItemCount = index - lastRowItemCount;
        rowArray.push({
          index,
          sceneOutPoint,
          rowItemCount,
          rowLength,
          rowWidth: rowLength * pixelPerFrameRatio + this.props.scaleValueObject.newThumbMargin * 2 * rowItemCount,
        });
      }
      return sceneOutPoint;
    })
    const maxWidth = Math.max(...rowArray.map(row => row.rowWidth), 0);
    console.log(rowArray);
    console.log(maxWidth);

    const height = Math.min(this.props.scaleValueObject.containerHeight / 3, Math.floor((this.props.scaleValueObject.containerHeight - (this.props.scaleValueObject.newThumbMargin * ((rows * 2) + 2))) / rows));
    const realWidth = (height / this.props.scaleValueObject.aspectRatioInv);

    return (
      <div
        data-tid='sceneGridDiv'
        className={styles.grid}
        id="SceneGrid"
      >
        <div
          data-tid='sceneGridBodyDiv'
          style={{
            width: maxWidth + realWidth, // enough width so when user selects thumb and it becomes wider, the row does not break into the next line
          }}
        >
          {sceneArray.map((scene, index) => {
            // minutes per row idea
            const selected = this.props.selectedSceneId ? (this.props.selectedSceneId === scene.sceneId) : false;
            const width = selected ? realWidth :
              pixelPerFrameRatio * scene.length;
            let doLineBreak = false;
            if ((scene.start + scene.length) > (minutesPerRow * 60 * 25 * lineCounter)) {
              doLineBreak = true;
              lineCounter += 1;
            }

            return (
            <SortableScene
              hidden={scene.hidden}
              controllersAreVisible={(this.props.showSettings || scene.sceneId === undefined) ? false : (scene.sceneId === this.state.controllersVisible)}
              selected={selected}
              doLineBreak={doLineBreak}
              defaultView={this.props.defaultView}
              keyObject={this.props.keyObject}
              indexForId={index}
              index={index}
              key={scene.sceneId}
              sceneId={scene.sceneId}
              margin={this.props.scaleValueObject.newThumbMargin}

              // only allow expanding of scenes which are not already large enough and deselecting
              allowSceneToBeSelected={selected || width < (realWidth * 0.95)}
              thumbWidth={width}
              thumbHeight={height}
              hexColor={`#${((1 << 24) + (Math.round(scene.colorArray[0]) << 16) + (Math.round(scene.colorArray[1]) << 8) + Math.round(scene.colorArray[2])).toString(16).slice(1)}`}
              thumbImageObjectUrl={getObjectProperty(() => {
                const thumb = this.props.thumbs.find((foundThumb) => foundThumb.sceneId === scene.sceneId);
                return this.props.thumbImages[thumb.frameId].objectUrl
              })}
              onOver={this.props.showSettings ? null : () => {
                // only setState if controllersVisible has changed
                if (this.state.controllersVisible !== scene.sceneId) {
                  this.setState({
                    controllersVisible: scene.sceneId,
                  });
                }
              }}
              onOut={this.props.showSettings ? null : () => {
                this.setState({
                  thumbsToDim: [],
                  controllersVisible: undefined,
                  addThumbBeforeController: undefined,
                  addThumbAfterController: undefined,
                });
              }}
              onToggle={(this.props.showSettings || (scene.sceneId !== this.state.controllersVisible)) ?
                null : () => this.props.onToggleClick(this.props.file.id, scene.sceneId)}
              onSelect={(this.props.showSettings || (scene.sceneId !== this.state.controllersVisible)) ?
                null : () => {
                  this.props.onSelectClick(scene.sceneId);
                }}
              onEnter={(this.props.showSettings || (scene.sceneId !== this.state.controllersVisible)) ?
                null : () => {
                  this.props.onEnterClick(this.props.file, scene.sceneId);
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
