// @flow
import React from 'react';
import PropTypes from 'prop-types';
import uuidV4 from 'uuid/v4';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import ThumbPlaceholder from './ThumbPlaceholder';
import ThumbGridHeader from './ThumbGridHeader';
import styles from './ThumbGrid.css';

// const SortableThumb = SortableElement(ThumbPlaceholder);

const ThumbGridPlaceholder = ({ thumbsAmount, file, columnWidth }) => {
  return (
    <div
      className={styles.grid}
      style={{
        width: columnWidth,
      }}
      id="ThumbGrid"
    >
      <ThumbGridHeader
        file={file}
      />
      { Array.apply(null, Array(thumbsAmount)).map((thumb, index) => {
        // console.log(index);
        return (
          // <SortableThumb
          <ThumbPlaceholder
            index={index}
            key={uuidV4()}
            width={file.width}
            height={file.height}
          />
        );
      }
      )}
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
