import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';
import { Button } from 'semantic-ui-react';
import { mapRange, secondsToTimeCode, limitRange } from './../utils/utils';
import styles from './VideoPlayer.css';

const pathModule = require('path');

class VideoPlayer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      // working: false,
      // filePath: '', // Setting video src="" prevents memory leak in chromium
      // playing: false,
      currentTime: undefined,
      duration: undefined,
      controlledPosition: {
        x: 0,
        y: 0
      },
      // cutStartTime: 0,
      // cutEndTime: undefined,
      // fileFormat: undefined,
    };

    this.updatePosition = this.updatePosition.bind(this);
    this.onDurationChange = this.onDurationChange.bind(this);
    this.onTimeUpdate = this.onTimeUpdate.bind(this);
    this.onControlledDrag = this.onControlledDrag.bind(this);

    this.onApplyClick = this.onApplyClick.bind(this);
    this.onCancelClick = this.onCancelClick.bind(this);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.positionRatio !== this.props.positionRatio) {
      this.updatePosition(this.props.positionRatio);
    }
  }

  onDurationChange(duration) {
    // setState is asynchronious
    // updatePosition needs to wait for setState, therefore it is put into callback of setState
    this.setState({ duration }, () => {
      this.updatePosition();
    });
  }

  updatePosition() {
    const currentTime = this.props.positionRatio * this.state.duration;
    console.log(`${currentTime} : ${this.props.positionRatio} : ${this.state.duration}`);
    console.log(this.state);
    this.onTimeUpdate(currentTime);
    this.video.currentTime = currentTime;
  }

  onTimeUpdate(currentTime) {
    this.setState({ currentTime });
    const newX = mapRange(currentTime, 0, this.state.duration, 0, this.props.width);
    this.setState({ controlledPosition: { x: newX, y: 0 } });
  }

  onControlledDrag(e, position) {
    const { x } = position;
    this.setState({ controlledPosition: { x, y: 0 } });
    const newCurrentTime = mapRange(x, 0, this.props.width, 0, this.state.duration, false);
    this.video.currentTime = newCurrentTime;
    this.setState({ currentTime: newCurrentTime });
  }

  onApplyClick = () => {
    const newPositionRatio = ((this.state.currentTime * 1.0) / this.state.duration);
    this.props.setNewFrame(this.props.thumbId, newPositionRatio);
  }

  onCancelClick = () => {
    this.props.closeModal();
  }

  render() {
    const dragHandlers = { onStart: this.onStart, onStop: this.onStop };
    const { controlledPosition } = this.state;
    console.log(this.props.positionRatio);
    return (
      <div>
        <div className={`${styles.player}`}>
          <video
            ref={(el) => { this.video = el; }}
            className={`${styles.video}`}
            controls
            muted
            src={`${pathModule.dirname(this.props.path)}/${encodeURIComponent(pathModule.basename(this.props.path))}` || ''}
            width={(this.props.height - this.props.controllerHeight) / this.props.aspectRatioInv}
            height={this.props.height - this.props.controllerHeight}
            onDurationChange={e => this.onDurationChange(e.target.duration)}
            onTimeUpdate={e => this.onTimeUpdate(e.target.currentTime)}
          >
            <track kind="captions" />
          </video>
        </div>
        <div className={`${styles.controlsWrapper}`}>
          <div className={`${styles.timelineWrapper}`}>
            <Draggable
              axis="x"
              handle=".handle"
              position={controlledPosition}
              onDrag={this.onControlledDrag}
              {...dragHandlers}
            >
              <div>
                <div className={`${styles.currentTime} handle`} />
              </div>
            </Draggable>
            <div id="currentTimeDisplay">{secondsToTimeCode(this.state.currentTime)}</div>
          </div>
          <Button
            fluid
            color="pink"
            onClick={this.onApplyClick}
          >
            Apply
          </Button>
        </div>
      </div>
    );
  }
}

VideoPlayer.contextTypes = {
  store: PropTypes.object,
  path: PropTypes.string,
  thumbId: PropTypes.number,
  positionRatio: PropTypes.number,
  setNewFrame: PropTypes.func,
  closeModal: PropTypes.func,
};

export default VideoPlayer;
