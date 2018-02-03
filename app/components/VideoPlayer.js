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
      // cutStartTime: 0,
      // cutEndTime: undefined,
      // fileFormat: undefined,
    };

    // const resetState = () => {
    //   const video = getVideo();
    //   video.currentTime = 0;
    //   video.playbackRate = 1;
    //   this.setState(defaultState);
    // };
  }

  onDurationChange(duration) {
    this.setState({ duration });
    // if (!this.state.cutEndTime) this.setState({ cutEndTime: duration });
  }

  render() {
    return (
      <div>
        <div id="player">
          <video
            controls
            src={`${pathModule.dirname(this.props.path)}/${encodeURIComponent(pathModule.basename(this.props.path))}` || ''}
            width="640px"
            height="360px"
            // onPlay={onPlay}
            // onPause={onPause}
            autoPlay
            // onRateChange={() => this.playbackRateChange()}
            onDurationChange={e => this.onDurationChange(e.target.duration)}
            onTimeUpdate={e => this.setState({ currentTime: e.target.currentTime })}
          >
            <track kind="captions" />
          </video>
        </div>
        <div className={`${styles.controlsWrapper}`}>
          <div className={`${styles.timelineWrapper}`}>
            <Draggable
              axis="x"
              handle=".handle"
              defaultPosition={{ x: 0, y: 0 }}
              position={null}
              grid={[25, 25]}
              onStart={this.handleStart}
              onDrag={this.handleDrag}
              onStop={this.handleStop}
            >
              <div>
                <div className="handle">Drag from here</div>
                <div className={`${styles.currentTime}`} style={{ left: `${((this.state.currentTime || 0) / (this.state.duration || 1)) * 100}%` }} />
              </div>
            </Draggable>
            <div className={`${styles.currentTime}`} style={{ left: `${((this.state.currentTime || 0) / (this.state.duration || 1)) * 100}%` }} />
            <div
              className={`${styles.cutStartTime}`}
              style={{
                left: `${((0) / (1)) * 100}%`,
                width: `${(((0) - (0)) / (1)) * 100}%`,
              }}
            />
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
