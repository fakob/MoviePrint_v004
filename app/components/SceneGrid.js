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
    const safetyMargin = 100;
    let lineCounter = 1;
    // const frameWidthInPixel =
    const rows = Math.ceil(this.props.frameCount / (minutesPerRow * 60 * 25 * 1.0));
    return (
      <div
        data-tid='sceneGridDiv'
        className={styles.grid}
        // style={{
        //   width: this.props.scaleValueObject.newMoviePrintWidth,
        //   marginLeft: this.props.defaultView === VIEW.GRIDVIEW ? undefined : (this.props.scaleValueObject.newThumbWidth / 4),
        // }}
        id="SceneGrid"
      >
        <div
          data-tid='sceneGridBodyDiv'
          style={{
            // width: '30000px',
            width: this.props.scaleValueObject.containerWidth * 2, // no concrete value, just for having enough width
            // marginLeft: this.props.defaultView === VIEW.GRIDVIEW ? undefined : (this.props.scaleValueObject.newThumbWidth / 4),
          }}
        >
          {sceneArray.map((scene, index) => {
            // minutes per row idea
            const selected = this.props.selectedSceneId ? (this.props.selectedSceneId === scene.sceneId) : false;
            // const height = 240;
            const height = Math.min(this.props.scaleValueObject.containerHeight / 3, Math.floor((this.props.scaleValueObject.containerHeight - (this.props.scaleValueObject.newThumbMargin * ((rows * 2) + 2))) / rows));
            // const width = Math.floor(((this.props.scaleValueObject.containerWidth - safetyMargin) / (1 * 60 * 25)) * scene.length) - this.props.scaleValueObject.newThumbMargin * 2;
            const realWidth = (height / this.props.scaleValueObject.aspectRatioInv);
            const width = selected ? realWidth :
              Math.floor(((this.props.scaleValueObject.containerWidth - safetyMargin) / (minutesPerRow * 60 * 25 * 1.0)) * scene.length) - this.props.scaleValueObject.newThumbMargin * 2;
            // const height = Math.floor((this.props.scaleValueObject.containerHeight - (this.props.scaleValueObject.newThumbMargin * ((minutesPerRow * 2) + 2))) / minutesPerRow);
            // const width = selected ? (height / this.props.scaleValueObject.aspectRatioInv):
            // Math.floor((scene.length / this.props.frameCount) * ((this.props.scaleValueObject.containerWidth - safetyMargin) * (minutesPerRow - 1)));
            let doLineBreak = false;
            if ((scene.start + scene.length) > (minutesPerRow * 60 * 25 * lineCounter)) {
              doLineBreak = true;
              lineCounter += 1;
            }
            // console.log(doLineBreak);
            // console.log(lineCounter);
            // console.log(scene.start + scene.length);
            // console.log(minutesPerRow * 60 * lineCounter);
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
              allowSceneToBeSelected={selected || width < (realWidth * 0.75)}
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
