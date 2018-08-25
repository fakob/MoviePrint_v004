import React from 'react';
import PropTypes from 'prop-types';
import styles from './ThumbGrid.css';

// import movieprint from './../img/Thumb_MOVIEPRINT.png';
import movieprint from './../img/MoviePrint-titleimage.svg';

const ThumbGridHeader = ({
  showMoviePrintView,
  filePath,
  fileName,
  fileDetails,
  showPathInHeader,
  showDetailsInHeader,
  showTimelineInHeader,
  headerHeight,
  thumbMargin,
  scaleValue,
  inPointPositionOnTimeline,
  cutWidthOnTimeLine,
  allFrameNumbersInPercentArray,
}) => {
  const headerMarginRatioTop = 0.25; // 25% of height
  const headerImageRatio = 0.5; // 50% of height
  const textRatio = 0.25; // 25% of height
  const newActualHeaderHeight = false ? headerHeight : headerHeight * 2;

  // console.log(headerHeight);
  return (
    <div
      className={styles.gridHeader}
      style={{
        height: newActualHeaderHeight,
        margin: thumbMargin,
      }}
    >
      <div
        className={styles.gridHeaderImageAndText}
        style={{
          transform: `translate(0px, ${headerHeight * headerMarginRatioTop}px)`,
          width: '100%',
        }}
      >
        <img
          src={movieprint}
          alt=""
          height={`${headerHeight * headerImageRatio}px`}
          style={{
            paddingLeft: `${headerHeight * textRatio}px`,
          }}
        />
        <div
          className={styles.gridHeaderText}
          style={{
            fontSize: `${headerHeight * textRatio}px`,
            float: 'right',
            paddingRight: `${headerHeight * textRatio}px`,
            lineHeight: `${headerHeight * textRatio * 1.8}px`,
          }}
        >
          <div
            className={styles.gridHeaderTextName}
            style={{
              fontSize: `${headerHeight * textRatio * 1.5}px`,
            }}
          >
            {fileName}
          </div>
          {showPathInHeader && <div
            style={{
              lineHeight: `${headerHeight * textRatio * 1.5}px`,
              marginTop: `${headerHeight * textRatio * 0.25}px`,
              textAlign: 'right',
            }}
          >
            {(filePath !== '') && `${filePath.substr(0, filePath.lastIndexOf('/'))}/`}
          </div>}
          {showDetailsInHeader && <div
            style={{
              lineHeight: `${headerHeight * textRatio * 1.5}px`,
              textAlign: 'right',
            }}
          >
            {fileDetails}
          </div>}
        </div>
        {showTimelineInHeader && <div
          className={styles.timelineWrapper}
          style={{
            height: `${headerHeight * textRatio * 1.2}px`,
            marginLeft: `${headerHeight * textRatio}px`,
            marginRight: `${headerHeight * textRatio}px`,
            marginTop: `${headerHeight * textRatio * 3}px`,
          }}
        >
          <div
            className={`${styles.timelineCut}`}
            style={{
              left: `${inPointPositionOnTimeline}%`,
              width: `${cutWidthOnTimeLine}%`,
            }}
          />
          {allFrameNumbersInPercentArray.map(frameInPercent => (
            <div
              className={`${styles.timelineThumbIndicator}`}
              style={{
                left: `${frameInPercent}%`,
                height: `${headerHeight * textRatio * 1.2}px`,
              }}
            />
            )
          )}
        </div>}
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
  fileDetails: PropTypes.string.isRequired,
  headerHeight: PropTypes.number.isRequired,
  thumbMargin: PropTypes.number.isRequired,
  scaleValue: PropTypes.number.isRequired,
};

export default ThumbGridHeader;
