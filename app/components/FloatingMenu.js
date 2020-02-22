import React from 'react';
import { Button, Dropdown, Popup } from 'semantic-ui-react';
import { SORT_METHOD, VIEW, SHEET_VIEW, SHEET_TYPE, SHEET_FIT, THUMB_INFO_OPTIONS } from '../utils/constants';
import styles from './FloatingMenu.css';
import stylesPop from './Popup.css';
import iconCutView from '../img/icon-cut-view.svg';
import iconThumbView from '../img/icon-thumb-view.svg';
import iconHeader from '../img/icon-header.svg';
import iconImage from '../img/icon-image.svg';
import iconNoImage from '../img/icon-no-image.svg';
import iconFrameInfo from '../img/icon-frame-info.svg';
import iconShowFaceRect from '../img/icon-show-face-rect.svg';
import iconArrowUp from '../img/icon-arrow-up.svg';
import iconHide from '../img/icon-hide.svg';
import iconUnhide from '../img/icon-unhide.svg';
import iconExpand from '../img/icon-expand.svg';
import iconZoomIn from '../img/icon-zoom-in.svg';
import iconZoomOut from '../img/icon-zoom-out.svg';
import iconResizeVertical from '../img/icon-resize-vertical.svg';
import iconResizeHorizontal from '../img/icon-resize-horizontal.svg';
import iconSort from '../img/icon-sort.svg';
import iconCopy from '../img/icon-copy.svg';
import iconGrid from '../img/icon-grid.svg';
import iconBarcode from '../img/icon-barcode.svg';
import iconAddInterval from '../img/icon-add-interval.svg';
import iconAddScene from '../img/icon-add-scene.svg';
import iconAddFace from '../img/icon-add-face.svg';
import icon2x2 from '../img/icon-2x2.svg';
import icon3x3 from '../img/icon-3x3.svg';
import icon4x4 from '../img/icon-4x4.svg';
import icon5x5 from '../img/icon-5x5.svg';
import icon6x6 from '../img/icon-6x6.svg';

const ButtonExampleCircularSocial = ({
  fileMissingStatus,
  hasParent,
  onAddIntervalSheetClick,
  onAddFaceSheetClick,
  onRescanFaceSheet,
  onBackToParentClick,
  onChangeSheetViewClick,
  onDuplicateSheetClick,
  onScanMovieListItemClick,
  onSetSheetFitClick,
  onSetViewClick,
  onSortSheet,
  onThumbInfoClick,
  onToggleHeaderClick,
  onToggleImagesClick,
  onToggleFaceRectClick,
  onToggleShowHiddenThumbsClick,
  scaleValueObject,
  settings,
  sheetType,
  sheetView,
  toggleZoom,
  visibilitySettings,
  zoom,
}) => {
  const { defaultThumbInfo, defaultShowImages } = settings;
  const { defaultView, defaultSheetFit, visibilityFilter } = visibilitySettings;
  const { moviePrintAspectRatioInv, containerAspectRatioInv } = scaleValueObject;
  const isGridViewAndDefault = sheetView === SHEET_VIEW.GRIDVIEW && defaultView === VIEW.STANDARDVIEW;
  const isFaceType = sheetType === SHEET_TYPE.FACES;
  const isShotType = sheetType === SHEET_TYPE.SCENES;

  return (
    <div className={`${styles.floatingMenu}`}>
      <Popup
        trigger={
          <Button
            className={`${styles.normalButton} ${styles.selected} ${
              hasParent && defaultView === VIEW.STANDARDVIEW ? '' : styles.hidden
            }`}
            style={{
              marginRight: '8px',
              marginLeft: '8px',
            }}
            size="large"
            circular
            data-tid="backToParentBtn"
            onClick={onBackToParentClick}
            icon={<img src={iconArrowUp} height="18px" alt="" />}
          />
        }
        mouseEnterDelay={1000}
        on={['hover']}
        position="bottom center"
        className={stylesPop.popup}
        content={<span>Back to parent MoviePrint</span>}
      />{' '}
      <Button.Group className={`${defaultView === VIEW.STANDARDVIEW ? '' : styles.hidden}`}>
        <Popup
          trigger={
            <Button
              className={styles.imageButton}
              size="large"
              data-tid="addShotDetectionMovieListItemBtn"
              onClick={() => onScanMovieListItemClick(undefined)}
              disabled={fileMissingStatus}
              icon={<img src={iconAddScene} height="18px" alt="" />}
            />
          }
          mouseEnterDelay={1000}
          on={['hover']}
          position="bottom center"
          className={stylesPop.popup}
          content="Add MoviePrint (shot detection based)"
        />
        <Popup
          trigger={
            <Dropdown
              button
              className={styles.dropDownButton}
              floating
              disabled={fileMissingStatus}
              icon={<img src={iconAddInterval} height="18px" alt="" />}
            >
              <Dropdown.Menu className={styles.dropDownMenu}>
                <Dropdown.Item className={styles.dropDownItem} onClick={() => onAddIntervalSheetClick(undefined, 4, 2)}>
                  <img src={icon2x2} height="18px" alt="" />
                  2x2
                </Dropdown.Item>
                <Dropdown.Item className={styles.dropDownItem} onClick={() => onAddIntervalSheetClick(undefined, 9, 3)}>
                  <img src={icon3x3} height="18px" alt="" />
                  3x3
                </Dropdown.Item>
                <Dropdown.Item
                  className={styles.dropDownItem}
                  onClick={() => onAddIntervalSheetClick(undefined, 16, 4)}
                >
                  <img src={icon4x4} height="18px" alt="" />
                  4x4
                </Dropdown.Item>
                <Dropdown.Item
                  className={styles.dropDownItem}
                  onClick={() => onAddIntervalSheetClick(undefined, 25, 5)}
                >
                  <img src={icon5x5} height="18px" alt="" />
                  5x5
                </Dropdown.Item>
                <Dropdown.Item
                  className={styles.dropDownItem}
                  onClick={() => onAddIntervalSheetClick(undefined, 36, 6)}
                >
                  <img src={icon6x6} height="18px" alt="" />
                  6x6
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          }
          mouseEnterDelay={1000}
          on={['hover']}
          position="right center"
          className={stylesPop.popup}
          content="Add MoviePrint (interval based)"
        />
        <Popup
          trigger={
            <Dropdown
              button
              className={styles.dropDownButton}
              floating
              disabled={fileMissingStatus}
              icon={<img src={iconAddFace} height="18px" alt="" />}
            >
              <Dropdown.Menu className={styles.dropDownMenu}>
                <Dropdown.Item className={styles.dropDownItem} onClick={() => onAddFaceSheetClick(0.01)}>
                  Current range - scan every 100th frame
                </Dropdown.Item>
                <Dropdown.Item className={styles.dropDownItem} onClick={() => onAddFaceSheetClick(0.1)}>
                  Current range - scan every 10th frame
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item className={styles.dropDownItem} onClick={() => onAddFaceSheetClick(0.01, true)}>
                  Whole movie - scan every 100th frame
                </Dropdown.Item>
                <Dropdown.Item className={styles.dropDownItem} onClick={() => onAddFaceSheetClick(0.1, true)}>
                  Whole movie - scan every 10th frame
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item className={styles.dropDownItem} onClick={onRescanFaceSheet}>
                  Re-scan selected thumbs
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          }
          mouseEnterDelay={1000}
          on={['hover']}
          position="right center"
          className={stylesPop.popup}
          content="Add MoviePrint (faces based)"
        />
      </Button.Group>{' '}
      <Button.Group className={`${defaultView === VIEW.STANDARDVIEW ? '' : styles.hidden}`}>
        <Popup
          trigger={
            <Dropdown
              button
              className={styles.dropDownButton}
              floating
              disabled={fileMissingStatus || isShotType}
              icon={<img src={iconSort} height="18px" alt="" />}
            >
              <Dropdown.Menu className={styles.dropDownMenu}>
                <Dropdown.Item className={styles.dropDownItem} onClick={() => onSortSheet(SORT_METHOD.REVERSE, false)}>
                  Reverse sort
                </Dropdown.Item>
                <Dropdown.Item
                  className={styles.dropDownItem}
                  onClick={() => onSortSheet(SORT_METHOD.FRAMENUMBER, false)}
                >
                  Sort by framenumber
                </Dropdown.Item>
                <Dropdown.Item
                  disabled={!isFaceType}
                  className={styles.dropDownItem}
                  onClick={() => onSortSheet(SORT_METHOD.FACESIZE, false)}
                >
                  Sort by face size
                </Dropdown.Item>
                <Dropdown.Item
                  disabled={!isFaceType}
                  className={styles.dropDownItem}
                  onClick={() => onSortSheet(SORT_METHOD.FACECOUNT, false)}
                >
                  Sort by face count in image
                </Dropdown.Item>
                <Dropdown.Item
                  disabled={!isFaceType}
                  className={styles.dropDownItem}
                  onClick={() => onSortSheet(SORT_METHOD.FACEOCCURRENCE, false)}
                >
                  Sort by occurrence of face
                </Dropdown.Item>
                <Dropdown.Item
                  disabled={!isFaceType}
                  className={styles.dropDownItem}
                  onClick={() => onSortSheet(SORT_METHOD.FACECONFIDENCE, false)}
                >
                  Sort by confidence value of face
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item
                  disabled={!isFaceType}
                  className={styles.dropDownItem}
                  onClick={() => onSortSheet(SORT_METHOD.UNIQUE, false)}
                >
                  Filter by unique faces and sort by occurrence and size
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          }
          mouseEnterDelay={1000}
          on={['hover']}
          position="right center"
          className={stylesPop.popup}
          content="Sort and Filter"
        />
        <Popup
          trigger={
            <Button
              className={styles.imageButton}
              size="large"
              data-tid="duplicateSheetItemBtn"
              onClick={() => onDuplicateSheetClick(undefined, undefined)}
              disabled={fileMissingStatus}
              icon={<img src={iconCopy} height="18px" alt="" />}
            />
          }
          mouseEnterDelay={1000}
          on={['hover']}
          position="bottom center"
          className={stylesPop.popup}
          content="Duplicate MoviePrint"
        />
        {defaultView === VIEW.STANDARDVIEW && (
          <Popup
            trigger={
              <Button
                className={styles.normalButton}
                size="large"
                disabled={isFaceType}
                data-tid={
                  sheetView === SHEET_VIEW.GRIDVIEW
                    ? 'changeViewSheetToTimelineViewBtn'
                    : 'changeViewSheetToGridViewBtn'
                }
                onClick={() =>
                  onChangeSheetViewClick(
                    undefined,
                    undefined,
                    sheetView === SHEET_VIEW.GRIDVIEW ? SHEET_VIEW.TIMELINEVIEW : SHEET_VIEW.GRIDVIEW,
                  )
                }
                icon={<img src={sheetView === SHEET_VIEW.GRIDVIEW ? iconBarcode : iconGrid} height="18px" alt="" />}
              />
            }
            mouseEnterDelay={1000}
            on={['hover']}
            position="bottom center"
            className={stylesPop.popup}
            content={sheetView === SHEET_VIEW.GRIDVIEW ? 'Switch to timeline view' : 'Switch to grid view'}
          />
        )}
        {defaultView !== VIEW.STANDARDVIEW && (
          <Popup
            trigger={
              <Button
                className={styles.imageButton}
                size="large"
                disabled={defaultView === VIEW.STANDARDVIEW}
                data-tid={
                  sheetView === SHEET_VIEW.GRIDVIEW
                    ? 'changeViewSheetToTimelineViewBtn'
                    : 'changeViewSheetToGridViewBtn'
                }
                onClick={() =>
                  onChangeSheetViewClick(
                    undefined,
                    undefined,
                    sheetView === SHEET_VIEW.GRIDVIEW ? SHEET_VIEW.TIMELINEVIEW : SHEET_VIEW.GRIDVIEW,
                  )
                }
                icon={
                  <img src={sheetView === SHEET_VIEW.GRIDVIEW ? iconCutView : iconThumbView} height="18px" alt="" />
                }
              />
            }
            mouseEnterDelay={1000}
            on={['hover']}
            position="bottom center"
            className={stylesPop.popup}
            content={sheetView === SHEET_VIEW.GRIDVIEW ? 'Switch to cut view' : 'Switch to thumb view'}
          />
        )}
      </Button.Group>{' '}
      <Popup
        trigger={
          <Button
            className={`${styles.normalButton} ${defaultView === VIEW.STANDARDVIEW ? '' : styles.selected}`}
            style={{
              marginRight: '8px',
              marginLeft: '8px',
            }}
            size="large"
            circular
            data-tid={defaultView === VIEW.STANDARDVIEW ? 'showPlayerBtn' : 'hidePlayerBtn'}
            disabled={fileMissingStatus}
            onClick={() => {
              if (defaultView === VIEW.STANDARDVIEW) {
                onSetViewClick(VIEW.PLAYERVIEW);
              } else {
                onSetViewClick(VIEW.STANDARDVIEW);
              }
              return undefined;
            }}
            icon={defaultView === VIEW.STANDARDVIEW ? 'video' : 'close'}
          />
        }
        mouseEnterDelay={1000}
        on={['hover']}
        position="bottom center"
        className={stylesPop.popup}
        content={
          defaultView === VIEW.STANDARDVIEW ? (
            <span>
              Show player view <mark>2</mark>
            </span>
          ) : (
            <span>
              Hide player view <mark>2</mark>
            </span>
          )
        }
      />{' '}
      <Button.Group className={`${defaultView === VIEW.STANDARDVIEW ? '' : styles.hidden}`}>
        {defaultSheetFit !== SHEET_FIT.HEIGHT && moviePrintAspectRatioInv < containerAspectRatioInv && (
          <Popup
            trigger={
              <Button
                className={styles.normalButton}
                size="large"
                disabled={!isGridViewAndDefault}
                data-tid="fitHeightBtn"
                onClick={() => onSetSheetFitClick(SHEET_FIT.HEIGHT)}
                icon={<img src={iconResizeVertical} height="18px" alt="" />}
              />
            }
            mouseEnterDelay={1000}
            on={['hover']}
            position="bottom center"
            className={stylesPop.popup}
            content="Fit height"
          />
        )}
        {defaultSheetFit !== SHEET_FIT.WIDTH && moviePrintAspectRatioInv > containerAspectRatioInv && (
          <Popup
            trigger={
              <Button
                className={styles.normalButton}
                size="large"
                disabled={!isGridViewAndDefault}
                data-tid="fitWidthBtn"
                onClick={() => onSetSheetFitClick(SHEET_FIT.WIDTH)}
                icon={<img src={iconResizeHorizontal} height="18px" alt="" />}
              />
            }
            mouseEnterDelay={1000}
            on={['hover']}
            position="bottom center"
            className={stylesPop.popup}
            content="Fit width"
          />
        )}
        {defaultSheetFit !== SHEET_FIT.BOTH && (
          <Popup
            trigger={
              <Button
                className={styles.normalButton}
                size="large"
                disabled={!isGridViewAndDefault}
                data-tid="fitAllBtn"
                onClick={() => onSetSheetFitClick(SHEET_FIT.BOTH)}
                icon={<img src={iconExpand} height="18px" alt="" />}
              />
            }
            mouseEnterDelay={1000}
            on={['hover']}
            position="bottom center"
            className={stylesPop.popup}
            content="Fit all"
          />
        )}
        <Popup
          trigger={
            <Button
              className={styles.normalButton}
              size="large"
              disabled={!isGridViewAndDefault}
              data-tid={zoom ? 'zoomOutBtn' : 'zoomInBtn'}
              onClick={toggleZoom}
              icon={<img src={zoom ? iconZoomOut : iconZoomIn} height="18px" alt="" />}
            />
          }
          mouseEnterDelay={1000}
          on={['hover']}
          position="bottom center"
          className={stylesPop.popup}
          content={zoom ? 'Zoom out' : 'Zoom in'}
        />
      </Button.Group>{' '}
      <Button.Group className={`${defaultView === VIEW.STANDARDVIEW ? '' : styles.hidden}`}>
        <Popup
          trigger={
            <Button
              className={styles.normalButton}
              size="large"
              circular
              data-tid={visibilityFilter === 'SHOW_ALL' ? 'showOnlyVisibleBtn' : 'showHiddenBtn'}
              onClick={onToggleShowHiddenThumbsClick}
              icon={<img src={visibilityFilter === 'SHOW_ALL' ? iconHide : iconUnhide} height="18px" alt="" />}
            />
          }
          mouseEnterDelay={1000}
          on={['hover']}
          position="bottom center"
          className={stylesPop.popup}
          content={visibilityFilter === 'SHOW_ALL' ? 'Show visible thumbs only' : 'Show hidden thumbs'}
        />
        <Popup
          trigger={
            <Button
              className={styles.imageButton}
              size="large"
              disabled={!isGridViewAndDefault}
              data-tid="toggleHeaderBtn"
              onClick={() => onToggleHeaderClick()}
            >
              <img src={iconHeader} height="18px" alt="" />
            </Button>
          }
          mouseEnterDelay={1000}
          on={['hover']}
          position="bottom center"
          className={stylesPop.popup}
          content="Show header"
        />
        <Popup
          trigger={
            <Button
              className={styles.imageButton}
              size="large"
              disabled={!isGridViewAndDefault}
              data-tid="showThumbInfoBtn"
              onClick={() => {
                const current = defaultThumbInfo;
                const currentIndex = THUMB_INFO_OPTIONS.findIndex(item => item.value === current);
                const nextIndex = currentIndex < THUMB_INFO_OPTIONS.length - 1 ? currentIndex + 1 : 0;
                onThumbInfoClick(THUMB_INFO_OPTIONS[nextIndex].value);
              }}
            >
              <img src={iconFrameInfo} height="18px" alt="" />
            </Button>
          }
          mouseEnterDelay={1000}
          on={['hover']}
          position="bottom center"
          className={stylesPop.popup}
          content="Show frames, timecode or none"
        />
        <Popup
          trigger={
            <Button
              className={styles.imageButton}
              size="large"
              data-tid="toggleFaceRectBtn"
              disabled={!isFaceType}
              onClick={() => onToggleFaceRectClick()}
              icon={<img src={iconShowFaceRect} height="18px" alt="" />}
            />
          }
          mouseEnterDelay={1000}
          on={['hover']}
          position="bottom center"
          className={stylesPop.popup}
          content="Toggle face rectangle"
        />
        <Popup
          trigger={
            <Button
              className={styles.imageButton}
              size="large"
              data-tid="toggleImageBtn"
              onClick={() => onToggleImagesClick()}
              icon={<img src={defaultShowImages ? iconNoImage : iconImage} height="18px" alt="" />}
            />
          }
          mouseEnterDelay={1000}
          on={['hover']}
          position="bottom center"
          className={stylesPop.popup}
          content="Toggle images"
        />
      </Button.Group>
    </div>
  );
};
export default ButtonExampleCircularSocial;
