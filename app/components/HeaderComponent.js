import React from 'react';
import PropTypes from 'prop-types';
import { Menu, Dropdown, Icon, Popup } from 'semantic-ui-react';
import {
  MENU_HEADER_HEIGHT, VIEW, SHEET_TYPE, SHEET_FIT
} from '../utils/constants';
import styles from './Menu.css';
import stylesPop from './Popup.css';

const Header = ({
  file, visibilitySettings, toggleMovielist, toggleSettings,
  onToggleShowHiddenThumbsClick, settings, onThumbInfoClick,
  openMoviesDialog, toggleZoom, zoom, toggleView, onSetViewClick, onSetSheetClick,
  sheetsArray, sceneArray, onSetSheetFitClick,
}) => {

  const thumbInfoOptions = [
    { value: 'frames', text: 'Show frames', 'data-tid':'framesOption'},
    { value: 'timecode', text: 'Show timecode', 'data-tid':'timecodeOption'},
    { value: 'hideInfo', text: 'Hide info', 'data-tid':'hideInfoOption'},
  ];

  const sheetOptions = (sheetsArray, sceneArray) => {
    sheetsArray.sort();
    const mappedArray = sheetsArray.map(sheet => {
      if (sheet.indexOf(SHEET_TYPE.SCENES) > -1) {
        return ({ value: sheet, text: `Scenes Print`, 'data-tid':`${sheet}SheetOption` });
      }
      if (sheet.indexOf(SHEET_TYPE.INTERVAL) > -1) {
        return ({ value: sheet, text: `Interval Print`, 'data-tid':`${sheet}SheetOption` });
      }
      const sceneIndex = sceneArray.findIndex(item => item.sceneId === sheet);
      return ({ value: sheet, text: `Interval Print - Scene ${sceneIndex}`, 'data-tid':`${sheet}SheetOption` });
    });
    return mappedArray;
  };
  const viewOptions = [
    { value: VIEW.GRIDVIEW, text: 'Grid view', 'data-tid':'gridViewOption'},
    { value: VIEW.PLAYERVIEW, text: 'Player view', 'data-tid':'playerViewOption', disabled: visibilitySettings.showSettings },
    { value: VIEW.TIMELINEVIEW, text: 'Timeline view', 'data-tid':'timelineViewOption', disabled: (visibilitySettings.defaultSheet.indexOf(SHEET_TYPE.SCENES) === -1) },
  ];

  return (
    <div
      className={`${styles.menu}`}
      style={{
        height: MENU_HEADER_HEIGHT
      }}
    >
      <Menu
        size="tiny"
        inverted
        // widths={3}
      >
        {file &&
          <Popup
            trigger={
              <Menu.Item
                data-tid={(visibilitySettings.showMovielist === false) ? 'showMovieListBtn' : 'hideMovieListBtn'}
                onClick={toggleMovielist}
              >
                <Icon
                  name="list"
                />
                {(visibilitySettings.showMovielist === false) ? 'Show Movie list' : 'Hide Movie list'}
              </Menu.Item>
            }
            className={stylesPop.popup}
            content={(visibilitySettings.showMovielist === false) ? 'Show Movie list' : 'Hide Movie list'}
            keepInViewPort={false}
          />
        }
        <Popup
          trigger={
            <Menu.Item
              data-tid='openMoviesBtn'
              onClick={openMoviesDialog}
            >
              Open Movies
            </Menu.Item>
          }
          className={stylesPop.popup}
          content="Open one or more movies"
          keepInViewPort={false}
        />
        {/* <Menu.Item>
          {file.name}
        </Menu.Item> */}
        <Menu.Menu position="right">
          {file && visibilitySettings.defaultView === VIEW.GRIDVIEW && !visibilitySettings.showSettings && visibilitySettings.defaultSheetFit !== SHEET_FIT.HEIGHT &&
            <Popup
              trigger={
                <Menu.Item
                  data-tid='fitHeightBtn'
                  onClick={() => onSetSheetFitClick(SHEET_FIT.HEIGHT)}
                >
                  <Icon
                    name='resize vertical'
                  />
                  Fit height
                </Menu.Item>
              }
              className={stylesPop.popup}
              content='Fit height'
              keepInViewPort={false}
            />
          }
          {file && visibilitySettings.defaultView === VIEW.GRIDVIEW && !visibilitySettings.showSettings && visibilitySettings.defaultSheetFit !== SHEET_FIT.WIDTH &&
            <Popup
              trigger={
                <Menu.Item
                  data-tid='fitWidthBtn'
                  onClick={() => onSetSheetFitClick(SHEET_FIT.WIDTH)}
                >
                  <Icon
                    name='resize horizontal'
                  />
                  Fit width
                </Menu.Item>
              }
              className={stylesPop.popup}
              content='Fit width'
              keepInViewPort={false}
            />
          }
          {file && visibilitySettings.defaultView === VIEW.GRIDVIEW && !visibilitySettings.showSettings && visibilitySettings.defaultSheetFit !== SHEET_FIT.BOTH &&
            <Popup
              trigger={
                <Menu.Item
                  data-tid='fitAllBtn'
                  onClick={() => onSetSheetFitClick(SHEET_FIT.BOTH)}
                >
                  <Icon
                    name='expand'
                  />
                  Fit all
                </Menu.Item>
              }
              className={stylesPop.popup}
              content='Fit all'
              keepInViewPort={false}
            />
          }
          {file && visibilitySettings.defaultView === VIEW.GRIDVIEW && !visibilitySettings.showSettings &&
            <Popup
              trigger={
                <Menu.Item
                  data-tid={zoom ? 'zoomOutBtn' : 'zoomInBtn'}
                  onClick={toggleZoom}
                >
                  <Icon
                    name={zoom ? 'zoom out' : 'zoom in'}
                  />
                  {zoom ? 'Zoom out' : 'Zoom in'}
                </Menu.Item>
              }
              className={stylesPop.popup}
              content={zoom ? 'Zoom out' : 'Zoom in'}
              keepInViewPort={false}
            />
          }
          {file &&
            <Popup
              trigger={
                <Dropdown
                  data-tid='setSheetDropdown'
                  placeholder="Show Print"
                  item
                  options={sheetOptions(sheetsArray, sceneArray)}
                  value={visibilitySettings.defaultSheet}
                  onChange={(e, { value }) => onSetSheetClick(value)}
                />
              }
              className={stylesPop.popup}
              content="Set sheet"
              keepInViewPort={false}
            />
          }
          {file &&
            <Popup
              trigger={
                <Dropdown
                  data-tid='setViewDropdown'
                  placeholder="Set view"
                  item
                  options={viewOptions}
                  value={visibilitySettings.defaultView}
                  onChange={(e, { value }) => onSetViewClick(value)}
                />
              }
              className={stylesPop.popup}
              content="Set view"
              keepInViewPort={false}
            />
          }
          {file &&
            <Popup
              trigger={
                <Menu.Item
                  data-tid={(visibilitySettings.visibilityFilter === 'SHOW_ALL') ? 'hideHiddenBtn' : 'showHiddenBtn'}
                  onClick={onToggleShowHiddenThumbsClick}
                >
                  <Icon
                    name={(visibilitySettings.visibilityFilter === 'SHOW_ALL') ? 'unhide' : 'hide'}
                  />
                  {(visibilitySettings.visibilityFilter === 'SHOW_ALL') ? 'Hide hidden' : 'Show hidden'}
                </Menu.Item>
              }
              className={stylesPop.popup}
              content={(visibilitySettings.visibilityFilter === 'SHOW_ALL') ? 'Show all' : 'Show only visible'}
              keepInViewPort={false}
            />
          }
          {file &&
            <Popup
              trigger={
                <Dropdown
                  data-tid='showThumbInfoDropdown'
                  placeholder="Show info"
                  item
                  options={thumbInfoOptions}
                  value={settings.defaultThumbInfo}
                  onChange={(e, { value }) => onThumbInfoClick(value)}
                />
              }
              className={stylesPop.popup}
              content="Show frames or timecode"
              keepInViewPort={false}
            />
          }
          <Popup
            trigger={
              <Menu.Item
                data-tid={(visibilitySettings.showSettings === false) ? 'moreSettingsBtn' : 'hideSettingsBtn'}
                onClick={toggleSettings}
              >
                <Icon
                  name="edit"
                />
                {(visibilitySettings.showSettings === false) ? 'More settings' : 'Hide settings'}
              </Menu.Item>
            }
            className={stylesPop.popup}
            content={(visibilitySettings.showSettings === false) ? 'More settings' : 'Hide settings'}
            keepInViewPort={false}
          />
        </Menu.Menu>
      </Menu>
    </div>
  );
};

Header.defaultProps = {
  file: undefined
};

Header.propTypes = {
  file: PropTypes.object,
};

export default Header;
