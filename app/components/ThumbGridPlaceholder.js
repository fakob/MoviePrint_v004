// @flow
import React from 'react';
import PropTypes from 'prop-types';
import uuidV4 from 'uuid/v4';
import { Grid } from 'semantic-ui-react';
import ThumbPlaceholder from './ThumbPlaceholder';
import ThumbGridHeader from './ThumbGridHeader';
import styles from './ThumbGrid.css';

const colors = [
  'red', 'orange', 'yellow', 'olive', 'green', 'teal', 'blue',
  'violet', 'purple', 'pink', 'brown', 'grey', 'black',
];

const ThumbGridPlaceholder = ({ thumbsAmount, file, columnCount, columnWidth }) => {
  return (
    <Grid columns={columnCount} padded>
      {colors.map(color => (
        <Grid.Column color={color} key={color}>
          {color}
        </Grid.Column>
      ))}
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
