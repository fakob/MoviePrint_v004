// @flow
import React from 'react';
import PropTypes from 'prop-types';
import { truncate, truncatePath, frameCountToTimeCode, formatBytes } from '../utils/utils';
import styles from './FileList.css';
import transparent from '../img/Thumb_TRANSPARENT.png';

const FileListElement = ({
  id, frameCount, fps, width, height, name, path,
  size, objectUrl, onClick, currentFileId, onErrorPosterFrame
}) => (
  <li
    data-tid={`fileListItem_${id}`}
    onClick={onClick}
    className={(currentFileId === id) ? `${styles.Highlight}` : ''}
  >
    {/* <div
      className={`${styles.croppedThumb}`}
      style={(objectUrl !== undefined) ? { backgroundImage: `url(${objectUrl})` } : { backgroundColor: '#1e1e1e' }}
      alt={`${name}`}
    /> */}
    <img
      // using image to use onError if objectUrl is not valid
      // this introduces a squeezed image though
      src={objectUrl !== undefined ? objectUrl : transparent}
      className={`${styles.croppedThumb}`}
      alt={`${name}`}
      onError={onErrorPosterFrame}
    />
    <div
      className={`${styles.Path}`}
      title={path.slice(0, path.lastIndexOf('/'))}
    >
      {truncatePath(path.slice(0, path.lastIndexOf('/')), 40)}
    </div>
    <div
      className={`${styles.Title}`}
      title={name}
    >
      {truncate(name, 48)}
    </div>
    <div className={`${styles.Detail}`}>
      <div className={`${styles.DetailLeft}`}>
        {frameCountToTimeCode(frameCount, fps)}
      </div>
      <div className={`${styles.DetailRight}`}>
        {formatBytes(size, 1)}
      </div>
      <div className={`${styles.DetailCenter}`}>
        {width} x {height}
      </div>
    </div>
  </li>
);

FileListElement.propTypes = {
  id: PropTypes.string.isRequired,
  frameCount: PropTypes.number,
  fps: PropTypes.number,
  width: PropTypes.number,
  height: PropTypes.number,
  objectUrl: PropTypes.string,
  currentFileId: PropTypes.string,
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  size: PropTypes.number.isRequired,
  onClick: PropTypes.func.isRequired
};

export default FileListElement;
