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
  length,
  hexColor,
}) => {
  // console.log(hexColor);
  return (
    <div
      id={`scene${indexForId}`}
      className={`${styles.gridItem}`}
      // height={`${(thumbWidth * aspectRatioInv)}px`}
      style={{
        width:`${length}px`,
        // height:`${200}px`,
        // width: length,
        // margin: `${defaultView === VIEW.THUMBVIEW ? margin : Math.max(1, margin)}px`,
        // outlineWidth: `${defaultView === VIEW.THUMBVIEW ? margin : Math.max(1, margin)}px`,
        // borderRadius: `${(selected && defaultView !== VIEW.THUMBVIEW) ? 0 : Math.ceil(borderRadius)}px`, // Math.ceil so the edge is not visible underneath the image
        backgroundColor: hexColor,
      }}
    >

    </div>
  );
};

Scene.defaultProps = {
};

Scene.propTypes = {
};

export default Scene;
