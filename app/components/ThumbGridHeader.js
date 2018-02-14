import React from 'react';
import PropTypes from 'prop-types';
import styles from './ThumbGrid.css';

import movieprint from './../img/Thumb_MOVIEPRINT.png';

const ThumbGridHeader = ({ filePath, fileName, headerHeight }) => {
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
        {`${filePath.substr(0, filePath.lastIndexOf('/'))}/`}
        <span
          className={styles.gridHeaderTextName}
        >
          {fileName}
        </span>
      </div>
    </div>
  );
};

ThumbGridHeader.defaultProps = {
};

ThumbGridHeader.propTypes = {
  filePath: PropTypes.string.isRequired,
  fileName: PropTypes.string.isRequired,
  headerHeight: PropTypes.number.isRequired,
};

export default ThumbGridHeader;
