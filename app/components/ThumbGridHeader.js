import React from 'react';
import PropTypes from 'prop-types';
import log from 'electron-log';
import { truncatePath, getTextWidth } from '../utils/utils';
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
  moviePrintWidth,
  headerHeight,
  logoHeight,
  thumbMargin,
  scaleValue,
  inPointPositionOnTimeline,
  cutWidthOnTimeLine,
  allFrameNumbersInPercentArray,
}) => {
  const headerMarginRatioTop = 0.25; // 25% of height
  const headerImageRatio = 0.5; // 50% of height
  const textRatio = 0.25; // 25% of height

  // calculate title text size
  const widthOfFileNameL = 20 + // 20 is an estimated value found via manual calibration
    getTextWidth(fileName, `bold ${logoHeight * textRatio * 1.5}px "Open sans"`);
  const widthOfFileNameS = 0 + // 20 is an estimated value found via manual calibration
    getTextWidth(fileName, `bold ${logoHeight * textRatio * 1.2}px "Open sans"`);
  const logoAspectRatio = 385 / 69.0;
  const spaceForFileName = moviePrintWidth -
    (logoHeight * textRatio * 8) - // padding left and right and some extra
    (logoHeight * headerImageRatio * logoAspectRatio) // logo width
  let fileNameRatio;
  let titleTextSize;
  let titleText = fileName;
  if (spaceForFileName > widthOfFileNameL) {
    log.debug('enough space for title');
    fileNameRatio = 1;
    titleTextSize = logoHeight * textRatio * 1.5;
  } else if (spaceForFileName > widthOfFileNameS) {
    log.debug('shrink font size a bit');
    fileNameRatio = spaceForFileName / widthOfFileNameL;
    log.debug(fileNameRatio);
    titleTextSize = logoHeight * textRatio * 1.5 * fileNameRatio;
  } else {
    log.debug('use small font size a truncate text');
    fileNameRatio = spaceForFileName / widthOfFileNameS;
    titleTextSize = logoHeight * textRatio * 1.2;
    const lengthOfFileName = fileName.length;
    const newLengthOfFileName = Math.floor(fileNameRatio * lengthOfFileName);
    titleText = truncatePath(fileName, newLengthOfFileName);
  }

  return (
    <div
      data-tid='thumbGridHeaderDiv'
      className={styles.gridHeader}
      style={{
        height: headerHeight,
        margin: thumbMargin,
      }}
    >
      <div
        className={styles.gridHeaderImageAndText}
        style={{
          transform: `translate(0px, ${logoHeight * headerMarginRatioTop}px)`,
          width: '100%',
        }}
      >
        <img
          data-tid='gridHeaderImg'
          className={styles.gridHeaderImage}
          src={movieprint}
          alt=""
          height={`${logoHeight * headerImageRatio}px`}
          style={{
            paddingLeft: `${logoHeight * textRatio}px`,
          }}
        />
        <div
          className={styles.gridHeaderText}
          style={{
            fontSize: `${logoHeight * textRatio}px`,
            float: 'right',
            paddingRight: `${logoHeight * textRatio}px`,
            lineHeight: `${logoHeight * textRatio * 1.8}px`,
          }}
        >
          <div
            data-tid='movieTitleText'
            className={styles.gridHeaderTextName}
            style={{
              fontSize: `${titleTextSize}px`,
              marginBottom: `${logoHeight * textRatio * 0.5}px`,
            }}
          >
            {titleText}
          </div>
          {showPathInHeader && <div
            data-tid='filePathText'
            style={{
              lineHeight: `${logoHeight * textRatio * 1.5}px`,
              textAlign: 'right',
            }}
          >
            {(filePath !== '') && `${filePath.substr(0, filePath.lastIndexOf('/'))}/`}
          </div>}
          {showDetailsInHeader && <div
            data-tid='fileDetailsText'
            style={{
              lineHeight: `${logoHeight * textRatio * 1.5}px`,
              textAlign: 'right',
            }}
          >
            {fileDetails}
          </div>}
        </div>
        {showTimelineInHeader && <div
          data-tid='timelineWrapperDiv'
          className={styles.timelineWrapper}
          style={{
            height: `${logoHeight * textRatio * 1.2}px`,
            marginLeft: `${logoHeight * textRatio}px`,
            marginRight: `${logoHeight * textRatio}px`,
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
                height: `${logoHeight * textRatio * 1.2}px`,
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
  logoHeight: PropTypes.number.isRequired,
  thumbMargin: PropTypes.number.isRequired,
  scaleValue: PropTypes.number.isRequired,
};

export default ThumbGridHeader;
