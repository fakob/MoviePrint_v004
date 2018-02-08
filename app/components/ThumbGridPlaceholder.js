// @flow
import React from 'react';
import PropTypes from 'prop-types';
import uuidV4 from 'uuid/v4';
import { Grid } from 'semantic-ui-react';
import ThumbPlaceholder from './ThumbPlaceholder';
import ThumbGridHeader from './ThumbGridHeader';
import styles from './ThumbGrid.css';
import empty from './../img/Thumb_EMPTY.png';

const colors = [
  'red', 'orange', 'yellow', 'olive', 'green', 'teal', 'blue',
  'violet', 'purple', 'pink', 'brown', 'grey', 'black',
];

const thumbWidth = 270;

const ThumbGridPlaceholder = ({ thumbsAmount, width, height, columnCount, rowCount,
  columnWidth, contentHeight, contentWidth, thumbWidth, thumbMargin, settings }) => {
  const headerHeight = settings.defaultHeaderHeight;
  const generalScale = 0.9;
  const marginWidth = 14;
  const marginHeight = 14;
  const scaleValueHeight = (((contentHeight * 1.0 * generalScale) -
    (marginHeight * 4) - headerHeight) / rowCount) /
    ((thumbWidth * (height / width)) + thumbMargin);
  const scaleValueWidth = (((contentWidth * 0.75 * generalScale) -
    (marginWidth * 4) - headerHeight) / columnCount) /
    (thumbWidth + thumbMargin); // 12 of 16 columns
  const scaleValue = Math.min(scaleValueHeight, scaleValueWidth);
  const newthumbWidth = thumbWidth * scaleValue;
  const newThumbHeight = thumbWidth * (height / width) * scaleValue;
  console.log(contentHeight);
  console.log(contentWidth);
  console.log(rowCount);
  console.log(height);
  console.log(columnWidth);
  console.log(columnCount);
  console.log(width);
  console.log(scaleValue);

  return (
    <div
      className={styles.grid}
      style={{
        // width: columnWidth,
        width: columnWidth * scaleValue,
        // zoom: scaleValue
      }}
    >
      <div
        className={styles.gridHeader}
        style={{
          height: headerHeight * scaleValue,
          backgroundColor: 'black',
          margin: (thumbMargin / 2) * scaleValue,
        }}
      />
      {Array.apply(null, Array(thumbsAmount)).map((val, i) => (
        <div >
          <div
            className={styles.gridItem}
            style={{
              width: newthumbWidth,
              height: newThumbHeight,
              backgroundColor: 'black',
              margin: (thumbMargin / 2) * scaleValue,
            }}
          />
          {/* <img
            src={empty}
            // className={styles.image}
            alt=""
            width={`${thumbWidth}px`}
            height={`${(thumbWidth * (height / width))}px`}
          /> */}
        </div>
      ))}
    </div>
  );
};

ThumbGridPlaceholder.propTypes = {
  thumbsAmount: PropTypes.number.isRequired,
  file: PropTypes.object,
  columnWidth: PropTypes.number.isRequired
};

// const SortableThumbGridPlaceholder = SortableContainer(ThumbGridPlaceholder);

export default ThumbGridPlaceholder;
// export default SortableThumbGridPlaceholder;
