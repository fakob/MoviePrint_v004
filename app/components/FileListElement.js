// @flow
import React from 'react';
import PropTypes from 'prop-types';
import { truncate, truncatePath, frameCountToTimeCode, formatBytes } from '../utils/utils';
import styles from './FileList.css';

import mpNotFound from './../img/MoviePrint_Corrupt_00000.jpg';

const FileListElement = ({ id, frameCount, fps, width, height, name, path,
  size, type, webkitRelativePath, objectUrl, onClick, currentFileId }) => {
  return (
    <li onClick={onClick} className={(currentFileId === id) ? `${styles.Highlight}` : ''} >
      <div
        // style={{ background: url((typeof objectUrl === 'undefined') ? mpNotFound : objectUrl) }}
        className={`${styles.croppedThumb}`}
        style={{ backgroundImage: `url(${objectUrl})` }}
        alt={`${name}`}
      />
      {/* <img
        src={(typeof objectUrl === 'undefined') ? `${mpNotFound}` : `${objectUrl}`}
        alt={`${name}`}
      /> */}
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
};

FileListElement.propTypes = {
  id: PropTypes.string.isRequired,
  lastModified: PropTypes.number.isRequired,
  lastModifiedDate: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  size: PropTypes.number.isRequired,
  type: PropTypes.string.isRequired,
  webkitRelativePath: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired
};

export default FileListElement;
