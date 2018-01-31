import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styles from './VideoPlayer.css';

const VideoPlayer = ({ path }) => {
  return (
    <div>
      <div id="player">
        <video
          src={path || ''}
          // onRateChange={() => this.playbackRateChange()}
          // onPlay={() => this.onPlay(true)}
          // onPause={() => this.onPlay(false)}
          // onDurationChange={e => this.onDurationChange(e.target.duration)}
          // onTimeUpdate={e => this.setState({ currentTime: e.target.currentTime })}
        />
      </div>
      <div className={`${styles.controlsWrapper}`}>
            <div className={`${styles.timelineWrapper}`}>
              <div className={`${styles.currentTime}`} style={{ left: `${((0) / (1)) * 100}%` }} />
              <div
                className={`${styles.cutStartTime}`}
                style={{
                  left: `${((0) / (1)) * 100}%`,
                  width: `${(((0) - (0)) / (1)) * 100}%`,
                }}
              />
            </div>
        </div>
      </div>
  );
};

VideoPlayer.contextTypes = {
  store: PropTypes.object
};

export default VideoPlayer;
