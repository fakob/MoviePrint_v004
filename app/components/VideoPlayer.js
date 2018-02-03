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
      windowWidth: 0,
      currentTime: undefined,
      duration: undefined,
      controlledPosition: {
        x: 0, y: 0
      },
      // cutStartTime: 0,
      // cutEndTime: undefined,
      // fileFormat: undefined,
    };
  }

  componentDidMount() {
    this.updateWindowDimensions();
    window.addEventListener('resize', this.updateWindowDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateWindowDimensions);
  }

  updateWindowDimensions() {
    this.setState({ windowWidth: window.innerWidth });
  }

  onDurationChange(duration) {
    this.setState({ duration });
    // if (!this.state.cutEndTime) this.setState({ cutEndTime: duration });
  }

  onControlledDrag(e, position) {
    const { x } = position;
    this.setState({ controlledPosition: { x, y: 0 } });
    const newCurrentTime = ((x * 1.0) / this.state.windowWidth) * this.state.duration;
    console.log(`${newCurrentTime} : ${this.state.duration} : ${this.state.windowWidth}`);
    this.refs.video.currentTime = newCurrentTime;
    this.setState({ currentTime: newCurrentTime });
  }

  render() {
    this.onControlledDrag = this.onControlledDrag.bind(this);
    this.updateWindowDimensions = this.updateWindowDimensions.bind(this);

    const dragHandlers = { onStart: this.onStart, onStop: this.onStop };
    const { controlledPosition } = this.state;

    return (
      <div>
        <div id="player">
          <video
            ref="video"
            controls
            muted
            src={`${pathModule.dirname(this.props.path)}/${encodeURIComponent(pathModule.basename(this.props.path))}` || ''}
            width="640px"
            height="360px"
            // onPlay={onPlay}
            // onPause={onPause}
            // autoPlay
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
              position={controlledPosition}
              {...dragHandlers}
              onDrag={this.onControlledDrag}
            >
              <div>
                {/* <div className={`${styles.currentTime} handle`} /> */}
                <div className={`${styles.currentTime} handle`} style={{ left: `${(this.state.currentTime / this.state.duration) * 100}%` }} />
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
