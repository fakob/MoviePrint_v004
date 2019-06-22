import React from 'react'
import { Button, Popup } from 'semantic-ui-react'
import {
  VIEW,
  SHEET_VIEW,
  SHEET_FIT,
  THUMB_INFO_OPTIONS,
} from '../utils/constants';
import styles from './FloatingMenu.css';
import stylesPop from './Popup.css';
import iconHeader from '../img/icon-header.svg';
import iconFrameInfo from '../img/icon-frame-info.svg';

const ButtonExampleCircularSocial = ({
  onChangeSheetViewClick,
  onSetViewClick,
  onSetSheetFitClick,
  onToggleHeaderClick,
  onToggleShowHiddenThumbsClick,
  onThumbInfoClick,
  scaleValueObject,
  settings,
  sheetView,
  toggleMovielist,
  toggleSettings,
  toggleZoom,
  visibilitySettings,
  zoom,
}) => {

  const isGridViewAndDefault = visibilitySettings.defaultSheetView === SHEET_VIEW.GRIDVIEW &&
    visibilitySettings.defaultView === VIEW.STANDARDVIEW;

  return (
    <div
      className={`${styles.floatingMenu}`}
    >
      <Popup
        trigger={
          <Button
            className={`${styles.textButton} ${visibilitySettings.showMovielist === false ? '' : styles.selected}`}
            style={{
              marginRight: '8px',
            }}
            data-tid={(visibilitySettings.showMovielist === false) ? 'showMovieListBtn' : 'hideMovieListBtn'}
            onClick={toggleMovielist}
          >
            Movie list
          </Button>
        }
        mouseEnterDelay={1000}
        position='bottom center'
        className={stylesPop.popup}
        content={(visibilitySettings.showMovielist === false) ? <span>Show Movie and Sheets list <mark>1</mark></span> : <span>Hide Movie list <mark>1</mark></span>}
      />
      {' '}
      <Button.Group>
        <Popup
          trigger={
            <Button
              className={styles.normalButton}
              circular
              data-tid={(sheetView === SHEET_VIEW.GRIDVIEW) ? 'changeViewSheetToTimelineViewBtn' : 'changeViewSheetToGridViewBtn'}
              onClick={() => onChangeSheetViewClick(undefined, undefined, (sheetView === SHEET_VIEW.GRIDVIEW) ? SHEET_VIEW.TIMELINEVIEW : SHEET_VIEW.GRIDVIEW)}
              icon={(sheetView === SHEET_VIEW.GRIDVIEW) ? 'barcode' : 'grid layout'}
            />
          }
          mouseEnterDelay={1000}
          position='bottom center'
          className={stylesPop.popup}
          content={(sheetView === SHEET_VIEW.GRIDVIEW) ? 'Switch to timeline view' : 'Switch to grid view'}
        />
      </Button.Group>
      {' '}
      <Button.Group>
        {visibilitySettings.defaultSheetFit !== SHEET_FIT.HEIGHT &&
          scaleValueObject.moviePrintAspectRatioInv < scaleValueObject.containerAspectRatioInv &&
          <Popup
            trigger={
              <Button
                className={styles.normalButton}
                disabled={!isGridViewAndDefault}
                data-tid='fitHeightBtn'
                onClick={() => onSetSheetFitClick(SHEET_FIT.HEIGHT)}
                icon='resize vertical'
              />
            }
            mouseEnterDelay={1000}
            position='bottom center'
            className={stylesPop.popup}
            content='Fit height'
          />
        }
        {visibilitySettings.defaultSheetFit !== SHEET_FIT.WIDTH &&
          scaleValueObject.moviePrintAspectRatioInv > scaleValueObject.containerAspectRatioInv &&
          <Popup
            trigger={
              <Button
                className={styles.normalButton}
                disabled={!isGridViewAndDefault}
                data-tid='fitWidthBtn'
                onClick={() => onSetSheetFitClick(SHEET_FIT.WIDTH)}
                icon='resize horizontal'
              />
            }
            mouseEnterDelay={1000}
            position='bottom center'
            className={stylesPop.popup}
            content='Fit width'
          />
        }
        {visibilitySettings.defaultSheetFit !== SHEET_FIT.BOTH &&
          <Popup
            trigger={
              <Button
                className={styles.normalButton}
                disabled={!isGridViewAndDefault}
                data-tid='fitAllBtn'
                onClick={() => onSetSheetFitClick(SHEET_FIT.BOTH)}
                icon='expand'
              />
            }
            mouseEnterDelay={1000}
            position='bottom center'
            className={stylesPop.popup}
            content='Fit all'
          />
        }
        <Popup
          trigger={
            <Button
              className={styles.normalButton}
              disabled={!isGridViewAndDefault}
              data-tid={zoom ? 'zoomOutBtn' : 'zoomInBtn'}
              onClick={toggleZoom}
              icon={zoom ? 'zoom out' : 'zoom in'}
            />
          }
          mouseEnterDelay={1000}
          position='bottom center'
          className={stylesPop.popup}
          content={zoom ? 'Zoom out' : 'Zoom in'}
        />
      </Button.Group>
      {' '}
      <Popup
        trigger={
          <Button
            className={`${styles.normalButton} ${visibilitySettings.defaultView === VIEW.STANDARDVIEW ? '' : styles.selected}`}
            style={{
              marginRight: '8px',
              marginLeft: '8px',
            }}
            circular
            data-tid={(visibilitySettings.defaultView === VIEW.STANDARDVIEW) ? 'showPlayerBtn' : 'hidePlayerBtn'}
            onClick={() => {
              if (visibilitySettings.defaultView === VIEW.STANDARDVIEW) {
                onSetViewClick(VIEW.PLAYERVIEW);
              } else {
                onSetViewClick(VIEW.STANDARDVIEW);
              }
              return undefined;
            }}
            icon="video"
          />
        }
        mouseEnterDelay={1000}
        position='bottom center'
        className={stylesPop.popup}
        content={(visibilitySettings.defaultView === VIEW.STANDARDVIEW) ? <span>Show player view <mark>2</mark></span> : <span>Hide player view <mark>2</mark></span>}
      />
      {' '}
      <Button.Group>
        <Popup
          trigger={
            <Button
              className={styles.normalButton}
              circular
              data-tid={(visibilitySettings.visibilityFilter === 'SHOW_ALL') ? 'showOnlyVisibleBtn' : 'showHiddenBtn'}
              onClick={onToggleShowHiddenThumbsClick}
              icon='hide'
            />
          }
          mouseEnterDelay={1000}
          position='bottom center'
          className={stylesPop.popup}
          content={(visibilitySettings.visibilityFilter === 'SHOW_ALL') ? 'Show visible thumbs' : 'Show hidden thumbs'}
        />
        <Popup
          trigger={
            <Button
              className={styles.imageButton}
              disabled={!isGridViewAndDefault}
              data-tid='toggleHeaderBtn'
              onClick={() => onToggleHeaderClick()}
            >
              <img src={iconHeader} height='14px' alt='' />
            </Button>
          }
          mouseEnterDelay={1000}
          position='bottom center'
          className={stylesPop.popup}
          content="Show header"
        />
        <Popup
          trigger={
            <Button
              className={styles.imageButton}
              disabled={!isGridViewAndDefault}
              data-tid='showThumbInfoBtn'
              onClick={() => {
                const current = settings.defaultThumbInfo;
                const currentIndex = THUMB_INFO_OPTIONS.findIndex(item => item.value === current);
                const nextIndex = currentIndex < THUMB_INFO_OPTIONS.length - 1 ? currentIndex + 1 : 0;
                onThumbInfoClick(THUMB_INFO_OPTIONS[nextIndex].value);
              }}
            >
              <img src={iconFrameInfo} height='14px' alt='' />
            </Button>
          }
          mouseEnterDelay={1000}
          position='bottom center'
          className={stylesPop.popup}
          content="Show frames, timecode or none"
        />
      </Button.Group>
      {' '}
      <Popup
        trigger={
          <Button
            className={`${styles.textButton} ${visibilitySettings.showSettings === false ? '' : styles.selected}`}
            style={{
              marginLeft: '8px',
            }}
            data-tid={(visibilitySettings.showSettings === false) ? 'moreSettingsBtn' : 'hideSettingsBtn'}
            onClick={toggleSettings}
          >
            Settings
          </Button>
        }
        mouseEnterDelay={1000}
        position='bottom center'
        className={stylesPop.popup}
        content={(visibilitySettings.showSettings === false) ? <span>Show settings <mark>3</mark></span> : <span>Hide settings <mark>3</mark></span>}
      />
    </div>
  )
}
export default ButtonExampleCircularSocial
