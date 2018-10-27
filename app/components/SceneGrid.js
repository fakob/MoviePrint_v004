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
  // getObjectProperty,
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
      // thumbsToDim: [],
      // controllersVisible: undefined,
      // addThumbBeforeController: undefined,
      // addThumbAfterController: undefined,
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
    const sceneArray = this.props.scenes ? this.props.scenes.sceneArray : [];
    // console.log(sceneArray);
    return (
      <div
        data-tid='sceneGridDiv'
        className={styles.grid}
        // style={{
        //   width: this.props.viewForPrinting ? this.props.scaleValueObject.newMoviePrintWidthForPrinting : this.props.scaleValueObject.newMoviePrintWidth,
        //   marginLeft: this.props.defaultView === VIEW.THUMBVIEW ? undefined : (this.props.scaleValueObject.newThumbWidth / 4),
        // }}
        id="SceneGrid"
      >
        <div
          data-tid='sceneGridBodyDiv'
        >
          {sceneArray.map(scene => (
            <SortableScene
              indexForId={scene.index}
              index={scene.index}
              key={scene.sceneId}
              sceneId={scene.sceneId}
              length={scene.length}
              hexColor={`#${((1 << 24) + (Math.round(scene.colorArray[0]) << 16) + (Math.round(scene.colorArray[1]) << 8) + Math.round(scene.colorArray[2])).toString(16).slice(1)}`}
            />))}
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
