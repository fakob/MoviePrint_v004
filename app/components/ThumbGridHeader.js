import React from 'react';
import PropTypes from 'prop-types';
import styles from './ThumbGrid.css';

import movieprint from './../img/Thumb_MOVIEPRINT.png';

const ThumbGridHeader = ({
  showMoviePrintView, filePath, fileName, headerHeight, thumbMargin, scaleValue
}) => {
  const headerMarginRatioTop = 0.25; // 30% of height
  const headerImageRatio = 0.5; // 50% of height
  const textRatio = 0.25; // 25% of height

  // console.log(headerHeight);
  return (
    <div
      className={styles.gridHeader}
      style={{
        height: headerHeight,
        margin: thumbMargin,
      }}
    >
      <div
        className={styles.gridHeaderImageAndText}
        style={{
          transform: `translate(0px, ${headerHeight * headerMarginRatioTop}px)`,
        }}
      >
        <img
          src={movieprint}
          alt=""
          height={`${headerHeight * headerImageRatio}px`}
        />
        <div
          className={styles.gridHeaderText}
          style={{
            fontSize: `${headerHeight * textRatio}px`,
          }}
        >
          {(filePath !== '') && `${filePath.substr(0, filePath.lastIndexOf('/'))}/`}
          <span
            className={styles.gridHeaderTextName}
            style={{
              fontSize: `${headerHeight * textRatio * 1.5}px`,
              lineHeight: `${(headerHeight * textRatio * 1.5) + 10}px`,
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
  showMoviePrintView: PropTypes.bool.isRequired,
  filePath: PropTypes.string.isRequired,
  fileName: PropTypes.string.isRequired,
  headerHeight: PropTypes.number.isRequired,
  thumbMargin: PropTypes.number.isRequired,
  scaleValue: PropTypes.number.isRequired,
};

export default ThumbGridHeader;
