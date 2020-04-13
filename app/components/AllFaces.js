/* eslint no-param-reassign: ["error"] */
/* eslint no-nested-ternary: "off" */

// @flow
import React from 'react';
// import PropTypes from 'prop-types';
// import { Popup } from 'semantic-ui-react';
// import { SHEET_TYPE, VIEW } from '../utils/constants';
import styles from './ThumbGrid.css';

const AllFaces = ({
  facesArray,
  thumbWidth,
  thumbHeight,
  ageFilterEnabled,
  uniqueFilterEnabled,
  faceCountFilterEnabled,
  faceOccurrenceFilterEnabled,
  sizeFilterEnabled,
  genderFilterEnabled,
  isExpanded,
  thumbHover = false,
}) =>
  facesArray.map(face => {
    const showFaceRect =
      (isExpanded && face.distToOrigin !== undefined) ||
      (!isExpanded && (!uniqueFilterEnabled || face.distToOrigin === 0));
    if (showFaceRect) {
      return (
        <FaceRect
          key={face.faceId}
          ageFilterEnabled={ageFilterEnabled}
          uniqueFilterEnabled={uniqueFilterEnabled}
          faceCountFilterEnabled={faceCountFilterEnabled}
          faceOccurrenceFilterEnabled={faceOccurrenceFilterEnabled}
          sizeFilterEnabled={sizeFilterEnabled}
          genderFilterEnabled={genderFilterEnabled}
          face={face}
          thumbWidth={thumbWidth}
          thumbHeight={thumbHeight}
          thumbHover={thumbHover}
        />
      );
    }
    return undefined;
  });

const FaceRect = React.memo(
  ({
    face: { box, ...faceExceptForBox },
    thumbWidth,
    thumbHeight,
    ageFilterEnabled,
    uniqueFilterEnabled,
    faceCountFilterEnabled,
    faceOccurrenceFilterEnabled,
    sizeFilterEnabled,
    genderFilterEnabled,
    thumbHover,
  }) => {
    const left = box.x * thumbWidth;
    const top = box.y * thumbHeight;
    const width = box.width * thumbWidth;
    const height = box.height * thumbHeight;
    const cornerLength = Math.max(2, Math.min(width, height) / 8) * -1;

    // embedding styles directly as html2Canvas ignores css styling of SVGs
    const svgStylingFill = 'none';
    const svgStylingStroke = 'rgba(255,80,6,1)';
    const svgStylingStrokeWidth = '1';

    const leftCornerLength = Math.max(1, left - cornerLength);
    const topCornerLength = Math.max(1, top - cornerLength);
    const leftWidth = Math.min(thumbWidth - 1, left + width);
    const topHeight = Math.min(thumbHeight - 1, top + height);
    const topHeightCornerLength = Math.min(thumbHeight - 1, topHeight + cornerLength);
    const leftWidthCornerLength = Math.min(thumbWidth - 1, leftWidth + cornerLength);

    const polylineLine0 = `${leftCornerLength}, ${top}, ${left}, ${top}, ${left}, ${topCornerLength}`;
    const polylineLine1 = `${leftWidth}, ${topCornerLength}, ${leftWidth}, ${top}, ${leftWidthCornerLength}, ${top}`;
    const polylineLine2 = `${leftCornerLength}, ${topHeight}, ${left}, ${topHeight}, ${left}, ${topHeightCornerLength}`;
    const polylineLine3 = `${leftWidth}, ${topHeightCornerLength}, ${leftWidth}, ${topHeight}, ${leftWidthCornerLength}, ${topHeight}`;
    return (
      <>
        <div
          className={`${thumbHover ? styles.faceHover : ''} ${styles.faceRect}`}
          title={JSON.stringify(faceExceptForBox)}
          style={{
            width: `${box.width * thumbWidth}px`,
            height: `${box.height * thumbHeight}px`,
            left: `${box.x * thumbWidth}px`,
            top: `${box.y * thumbHeight}px`,
          }}
        />
        <div className={styles.faceRectSVG} title={JSON.stringify(faceExceptForBox)}>
          <svg width={thumbWidth} height={thumbHeight}>
            <polyline
              points={polylineLine0}
              fill={svgStylingFill}
              stroke={svgStylingStroke}
              strokeWidth={svgStylingStrokeWidth}
            />
            <polyline
              points={polylineLine1}
              fill={svgStylingFill}
              stroke={svgStylingStroke}
              strokeWidth={svgStylingStrokeWidth}
            />
            <polyline
              points={polylineLine2}
              fill={svgStylingFill}
              stroke={svgStylingStroke}
              strokeWidth={svgStylingStrokeWidth}
            />
            <polyline
              points={polylineLine3}
              fill={svgStylingFill}
              stroke={svgStylingStroke}
              strokeWidth={svgStylingStrokeWidth}
            />
          </svg>
        </div>
        {thumbHover &&
          (ageFilterEnabled ||
            uniqueFilterEnabled ||
            faceCountFilterEnabled ||
            faceOccurrenceFilterEnabled ||
            sizeFilterEnabled ||
            genderFilterEnabled) && (
            <div
              className={styles.faceRectTag}
              style={{
                left: `${box.x * thumbWidth + box.width * thumbWidth}px`,
                top: `${box.y * thumbHeight}px`,
              }}
            >
              {ageFilterEnabled && <div>{`age: ${faceExceptForBox.age}`}</div>}
              {(uniqueFilterEnabled || faceOccurrenceFilterEnabled) && (
                <div>{`found: ${faceExceptForBox.faceOccurrence}x`}</div>
              )}
              {sizeFilterEnabled && <div>{`size: ${faceExceptForBox.size}`}</div>}
              {genderFilterEnabled && <div>{`${faceExceptForBox.gender === 'female' ? '\u2640' : '\u2642'}`}</div>}
              <br />
            </div>
          )}
      </>
    );
  },
);

// Thumb.defaultProps = {
//   controllersAreVisible: false,
//   dim: undefined,
//   hidden: false,
//   index: undefined,
//   indexForId: undefined,
//   keyObject: {},
//   onOver: null,
//   onSelect: null,
//   selected: false,
//   thumbImageObjectUrl: undefined,
//   thumbInfoValue: undefined,
// };
//
// Thumb.propTypes = {
//   aspectRatioInv: PropTypes.number.isRequired,
//   borderRadius: PropTypes.number.isRequired,
//   color: PropTypes.string.isRequired,
//   controllersAreVisible: PropTypes.bool,
//   dim: PropTypes.object,
//   hidden: PropTypes.bool,
//   inputRefThumb: PropTypes.object,
//   keyObject: PropTypes.object,
//   margin: PropTypes.string.isRequired,
//   onOver: PropTypes.func,
//   onSelect: PropTypes.func,
//   onThumbDoubleClick: PropTypes.func,
//   selected: PropTypes.bool,
//   sheetType: PropTypes.string.isRequired,
//   index: PropTypes.number,
//   indexForId: PropTypes.number,
//   thumbImageObjectUrl: PropTypes.string,
//   thumbInfoValue: PropTypes.string,
//   thumbWidth: PropTypes.number.isRequired,
// };

export default AllFaces;
