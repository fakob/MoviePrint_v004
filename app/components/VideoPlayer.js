import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';
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
      width: 640,
      height: 360
      // cutStartTime: 0,
      // cutEndTime: undefined,
      // fileFormat: undefined,
    };
  }

  onDurationChange(duration) {
    this.setState({ duration });
    this.setState({ currentTime: this.props.positionRatio * this.state.duration });
    // if (!this.state.cutEndTime) this.setState({ cutEndTime: duration });
  }

  onTimeUpdate(currentTime) {
    this.setState({ currentTime });
    const newX = (currentTime / this.state.duration) * this.state.width;
    this.setState({ controlledPosition: { x: newX, y: 0 } });
  }

  onControlledDrag(e, position) {
    const { x } = position;
    this.setState({ controlledPosition: { x, y: 0 } });
    const newCurrentTime = ((x * 1.0) / this.state.width) * this.state.duration;
    this.video.currentTime = newCurrentTime;
    this.setState({ currentTime: newCurrentTime });
  }

  render() {
    this.onControlledDrag = this.onControlledDrag.bind(this);

    const dragHandlers = { onStart: this.onStart, onStop: this.onStop };
    const { controlledPosition } = this.state;

    return (
      <div>
        <div className={`${styles.player}`}>
          <video
            className={`${styles.video}`}
            ref={(el) => { this.video = el; }}
            controls
            muted
            src={`${pathModule.dirname(this.props.path)}/${encodeURIComponent(pathModule.basename(this.props.path))}` || ''}
            width={this.state.width}
            height={this.state.height}
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
            <div id="currentTimeDisplay">{this.state.currentTime}</div>
          </div>
        </div>
      </div>
    );
  }
}

VideoPlayer.contextTypes = {
  store: PropTypes.object
};

export default VideoPlayer;
