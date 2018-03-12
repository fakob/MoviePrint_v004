import React from 'react';
import PropTypes from 'prop-types';
import styles from './ThumbGrid.css';

import movieprint from './../img/Thumb_MOVIEPRINT.png';

const ThumbGridHeader = ({
  zoomOut, filePath, fileName, headerHeight, thumbMargin, scaleValue
}) => {
  const moviePrintHeaderImageHeight = 124;
  const moviePrintHeaderImageWidth = 528;

  return (
    <div
      className={styles.gridHeader}
      style={{
        height: headerHeight,
        margin: thumbMargin,
      }}
    >
      <div
        className={styles.gridHeaderImage}
        style={{
          transformOrigin: 'left top',
          transform: `scale(${scaleValue})`,
        }}
      >
        <img
          src={movieprint}
          alt=""
        />
      </div>
      {!zoomOut && <div
        className={styles.gridHeaderText}
      >
        {`${filePath.substr(0, filePath.lastIndexOf('/'))}/`}
        <span
          className={styles.gridHeaderTextName}
        >
          {fileName}
        </span>
      </div>}
    </div>
  );
};

ThumbGridHeader.defaultProps = {
};

ThumbGridHeader.propTypes = {
  zoomOut: PropTypes.bool.isRequired,
  filePath: PropTypes.string.isRequired,
  fileName: PropTypes.string.isRequired,
  headerHeight: PropTypes.number.isRequired,
  thumbMargin: PropTypes.number.isRequired,
  scaleValue: PropTypes.number.isRequired,
};

export default ThumbGridHeader;
