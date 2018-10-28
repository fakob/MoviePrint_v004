/* eslint no-param-reassign: ["error"] */
// @flow
import React from 'react';
import PropTypes from 'prop-types';
import { SortableHandle } from 'react-sortable-hoc';
import { Popup } from 'semantic-ui-react';
import {
  MINIMUM_WIDTH_TO_SHRINK_HOVER,
  MINIMUM_WIDTH_TO_SHOW_HOVER,
  VIEW,
} from '../utils/constants';
import styles from './SceneGrid.css';
import stylesPop from './Popup.css';

import transparent from '../img/Thumb_TRANSPARENT.png';

// const DragHandle = SortableHandle(({ width, height, thumbId }) =>
//   (
//     <Popup
//       trigger={
//         <button
//           data-tid={`thumbDragHandleBtn_${thumbId}`}
//           className={`${styles.dragHandleButton}`}
//           style={{
//             width,
//             height: Math.floor(height),
//           }}
//         >
//           <img
//             src={transparent}
//             style={{
//               width,
//               height: Math.floor(height),
//             }}
//             alt=""
//           />
//         </button>
//       }
//       className={stylesPop.popup}
//       content="Drag thumb"
//     />
//   ));

const Scene = ({
  indexForId,
  key,
  sceneId,
  margin,
  width,
  height,
  hexColor,
  thumbImageObjectUrl,
}) => {
  // console.log(hexColor);
  // const height = '14px';
  return (
    <div
      id={`scene${indexForId}`}
      className={`${styles.gridItem}`}
      // height={`${(thumbWidth * aspectRatioInv)}px`}
      style={{
        width:`${width}px`,
        height:`${height}px`,
        // width: width,
        margin: `${margin}px`,
        // outlineWidth: `${defaultView === VIEW.THUMBVIEW ? margin : Math.max(1, margin)}px`,
        // borderRadius: `${(selected && defaultView !== VIEW.THUMBVIEW) ? 0 : Math.ceil(borderRadius)}px`, // Math.ceil so the edge is not visible underneath the image
        backgroundColor: hexColor,
        backgroundImage: `url(${thumbImageObjectUrl !== undefined ? thumbImageObjectUrl : transparent})`,
      }}
    >
      {/* <img
        // data-tid={`thumbImg_${thumbId}`}
        src={thumbImageObjectUrl !== undefined ? thumbImageObjectUrl : transparent}
        id={`thumbImage${indexForId}`}
        className={`${styles.image}`}
        alt=""
        // width={`${thumbWidth}px`}
        // height={`${(thumbWidth * aspectRatioInv)}px`}
        width={`${width}px`}
        height={`${height}px`}
        style={{
          // borderRadius: `${(selected && defaultView !== VIEW.THUMBVIEW) ? 0 : borderRadius}px`,
        }}
      /> */}
    </div>
  );
};

Scene.defaultProps = {
};

Scene.propTypes = {
};

export default Scene;
