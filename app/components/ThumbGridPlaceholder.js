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

const ThumbGridPlaceholder = ({ thumbsAmount, width, height, columnCount, rowCount, columnWidth, contentHeight, contentWidth, thumbWidth, thumbMargin }) => {
  const scaleValueHeight = ((contentHeight * 1.0) / rowCount) / ((thumbWidth * (height / width)) + thumbMargin);
  const scaleValueWidth = ((contentWidth * 0.75) / columnCount) / (thumbWidth + thumbMargin); // 12 of 16 columns
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
          {/* {i} */}
        </div>
      ))}
      {/* {gridArray.map(color => (
        <Grid.Column color={color} key={color}>
          {color}
        </Grid.Column>
      ))} */}
    </div>
    // <div
    //   className={styles.grid}
    //   style={{
    //     width: columnWidth,
    //   }}
    //   id="ThumbGrid"
    // >
    //   <ThumbGridHeader
    //     file={file}
    //   />
    //   { Array.apply(null, Array(thumbsAmount)).map((thumb, index) => {
    //     // console.log(index);
    //     return (
    //       // <SortableThumb
    //       <ThumbPlaceholder
    //         index={index}
    //         key={uuidV4()}
    //         width={file.width}
    //         height={file.height}
    //       />
    //     );
    //   }
    //   )}
    // </div>
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
