import React from 'react';
import PropTypes from 'prop-types';
import styles from './ThumbGrid.css';

import movieprint from './../img/Thumb_MOVIEPRINT.png';

const ThumbGridHeader = ({
  zoomOut, filePath, fileName, headerHeight, thumbMargin, scaleValue
}) => {
  const moviePrintHeaderImageHeight = 124;
  const moviePrintHeaderImageWidth = 528;
  console.log(headerHeight);
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
          // transformOrigin: 'left top',
          // transform: `scale(${scaleValue})`,
        }}
      >
        <img
          src={movieprint}
          alt=""
          height={`${moviePrintHeaderImageHeight * scaleValue}px`}
          width={`${moviePrintHeaderImageWidth * scaleValue}px`}
        />
      </div>
      {/* {!zoomOut && */}
        <div
          className={styles.gridHeaderText}
          style={{
            // transformOrigin: 'left top',
            // transform: `translate(${(moviePrintHeaderImageWidth * scaleValue) - moviePrintHeaderImageWidth}px)`,
            height: `${128 * scaleValue}px`,
            lineHeight: `${48 * scaleValue}px`,
            fontSize: `${40 * scaleValue}px`,
            paddingTop: `${40 * scaleValue}px`,
          }}
        >
          {`${filePath.substr(0, filePath.lastIndexOf('/'))}/`}
          <span
            className={styles.gridHeaderTextName}
            style={{
              fontSize: `${48 * scaleValue}px`,
              letterSpacing: `${1.2 * scaleValue}px`,
            }}
          >
            {fileName}
          </span>
        </div>
      {/* } */}
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
