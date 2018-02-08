import React from 'react';
import styles from './ThumbGrid.css';

import movieprint from './../img/Thumb_MOVIEPRINT.png';

const ThumbGridHeader = ({ file, headerHeight }) => {
  return (
    <div
      className={styles.gridHeader}
      style={{
        height: headerHeight,
      }}
    >
      <div
        className={styles.gridHeaderImage}
      >
        <img
          src={movieprint}
          alt=""
        />
      </div>
      <div
        className={styles.gridHeaderText}
      >
        {`${file.path.substr(0, file.path.lastIndexOf('/'))}/`}
        <span
          className={styles.gridHeaderTextName}
        >
          {file.name}
        </span>
      </div>
    </div>
  );
};

export default ThumbGridHeader;
