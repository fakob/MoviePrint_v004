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

const ThumbGridPlaceholder = ({ thumbsAmount, width, height, columnCount, rowCount, columnWidth, contentHeight, contentWidth }) => {
  const gridArray = new Array(thumbsAmount);
  const scaleValueHeight = ((contentHeight * 1.0) / rowCount) / height;
  const scaleValueWidth = ((contentWidth * 0.75) / columnCount) / width; // 12 of 16 columns
  const scaleValue = Math.min(scaleValueHeight, scaleValueWidth);
  // const newThumbWidth = thumbWidth * scaleValue;
  // const newThumbHeight = newThumbWidth * (height / width);

  return (
    <Grid columns={columnCount} padded
      style={{
        zoom: scaleValue
      }}
    >
      {Array.apply(null, Array(thumbsAmount)).map((val, i) => (
        <Grid.Column >
          <div
            id="rectangle"
            style={{
              width: width,
              height: height,
              backgroundColor: 'black'
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
        </Grid.Column>
      ))}
      {/* {gridArray.map(color => (
        <Grid.Column color={color} key={color}>
          {color}
        </Grid.Column>
      ))} */}
    </Grid>
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
