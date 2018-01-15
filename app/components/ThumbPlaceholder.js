// @flow
import React from 'react';
import PropTypes from 'prop-types';
import { SortableHandle } from 'react-sortable-hoc';
import styles from './ThumbGrid.css';

import empty from './../img/Thumb_EMPTY.png';

const ThumbPlaceholder = ({ width, height }) => {
  const thumbWidth = 270;
  // console.log(`width: ${width}`);

  return (
    <div
      className={styles.gridItem}
    >
      <img
        src={empty}
        className={styles.image}
        alt=""
        width={`${thumbWidth}px`}
        height={`${(thumbWidth * (height / width))}px`}
      />
    </div>
  );
};

ThumbPlaceholder.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired
};

export default ThumbPlaceholder;
