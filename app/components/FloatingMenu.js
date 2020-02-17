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
            icon="arrow up"
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
            >
              <img src={iconAddScene} height="18px" alt="" />
            </Button>
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
                  Scan for faces (check 1% of frames)
                </Dropdown.Item>
                <Dropdown.Item className={styles.dropDownItem} onClick={() => onAddFaceSheetClick(0.1)}>
                  Scan for faces - detailed (check 10% of frames)
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item className={styles.dropDownItem} onClick={onRescanFaceSheet}>
                  Re-scan selected thumbs
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item className={styles.dropDownItem} onClick={() => onAddFaceSheetClick(0.01, true)}>
                  Scan for faces - whole movie (check 1% of frames)
                </Dropdown.Item>
                <Dropdown.Item className={styles.dropDownItem} onClick={() => onAddFaceSheetClick(0.1, true)}>
                  Scan for faces - whole movie - detailed (check 10% of frames)
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          }
          mouseEnterDelay={1000}
          on={['hover']}
          position="right center"
          className={stylesPop.popup}
          content="BETA: Add FacePrint"
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
              icon="sort amount down"
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
          content="BETA: Filter and Sort"
        />
        <Popup
          trigger={
            <Button
              className={styles.normalButton}
              size="large"
              data-tid="duplicateSheetItemBtn"
              onClick={() => onDuplicateSheetClick(undefined, undefined)}
              disabled={fileMissingStatus}
              icon="copy"
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
                icon={sheetView === SHEET_VIEW.GRIDVIEW ? 'barcode' : 'grid layout'}
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
              >
                <img src={sheetView === SHEET_VIEW.GRIDVIEW ? iconCutView : iconThumbView} height="18px" alt="" />
              </Button>
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
                icon="resize vertical"
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
                icon="resize horizontal"
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
                icon="expand"
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
              icon={zoom ? 'zoom out' : 'zoom in'}
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
              icon={visibilityFilter === 'SHOW_ALL' ? 'hide' : 'unhide'}
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
              data-tid="toggleImageBtn"
              onClick={() => onToggleImagesClick()}
            >
              <img src={defaultShowImages ? iconNoImage : iconImage} height="18px" alt="" />
            </Button>
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
