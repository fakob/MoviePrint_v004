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
    const sceneRowCount = this.props.rowCount;
    const sceneArray = this.props.scenes;
    const safetyMargin = 100;
    return (
      <div
        data-tid='sceneGridDiv'
        className={styles.grid}
        // style={{
        //   width: this.props.viewForPrinting ? this.props.scaleValueObject.newMoviePrintWidthForPrinting : this.props.scaleValueObject.newMoviePrintWidth,
        //   marginLeft: this.props.defaultView === VIEW.GRIDVIEW ? undefined : (this.props.scaleValueObject.newThumbWidth / 4),
        // }}
        id="SceneGrid"
      >
        <div
          data-tid='sceneGridBodyDiv'
        >
          {sceneArray.map((scene, index) => {
            // minutes per row idea
            // const height = 240;
            // const width = Math.floor(((this.props.scaleValueObject.containerWidth - safetyMargin) / (sceneRowCount * 60 * 25)) * scene.length) - this.props.scaleValueObject.newThumbMargin * 2;
            const selected = this.props.selectedSceneId ? (this.props.selectedSceneId === scene.sceneId) : false;
            const height = Math.floor((this.props.scaleValueObject.containerHeight - (this.props.scaleValueObject.newThumbMargin * ((sceneRowCount * 2) + 2))) / sceneRowCount);
            const width = selected ? (height / this.props.scaleValueObject.aspectRatioInv):
            Math.floor((scene.length / this.props.frameCount) * ((this.props.scaleValueObject.containerWidth - safetyMargin) * (sceneRowCount - 1)));
            return (
            <SortableScene
              hidden={scene.hidden}
              controllersAreVisible={(this.props.showSettings || scene.sceneId === undefined) ? false : (scene.sceneId === this.state.controllersVisible)}
              selected
              defaultView={this.props.defaultView}
              keyObject={this.props.keyObject}
              indexForId={index}
              index={index}
              key={scene.sceneId}
              sceneId={scene.sceneId}
              // start={scene.start}
              // length={scene.length}
              margin={this.props.scaleValueObject.newThumbMargin}
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
