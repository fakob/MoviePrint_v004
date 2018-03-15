import React from 'react';
import PropTypes from 'prop-types';
import styles from './ThumbGrid.css';

import movieprint from './../img/Thumb_MOVIEPRINT.png';

const ThumbGridHeader = ({
  zoomOut, filePath, fileName, headerHeight, thumbMargin, scaleValue
}) => {
  const bottomMarginRatio = 0.3; // 30% of height
  const headerImageRatio = 0.5; // 50% of height
  const textRatio = 0.25; // 25% of height

  console.log(headerHeight);
  return (
    <div
      className={styles.gridHeader}
      style={{
        height: headerHeight,
        margin: thumbMargin,
        position: 'relative',
      }}
    >
      <div
        className={styles.gridHeaderImage}
        style={{
          transformOrigin: 'left bottom',
          transform: `translate(0px, ${headerHeight * bottomMarginRatio}px)`,
          verticalAlign: 'baseline',
        }}
      >
        <img
          src={movieprint}
          alt=""
          height={`${headerHeight * headerImageRatio}px`}
          style={{
            display: 'inline-block',
          }}
        />
        <div
          className={styles.gridHeaderText}
          style={{
            fontSize: `${headerHeight * textRatio}px`,
            display: 'inline-block',
          }}
        >
          {(filePath !== '') && `${filePath.substr(0, filePath.lastIndexOf('/'))}/`}
          <span
            className={styles.gridHeaderTextName}
            style={{
              fontSize: `${headerHeight * textRatio * 1.5}px`,
              // letterSpacing: `${1.2 * scaleValue}px`,
            }}
          >
            {fileName}
          </span>
        </div>
      </div>
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
