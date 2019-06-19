import React from 'react';
import PropTypes from 'prop-types';
import { Menu, Dropdown, Icon, Popup } from 'semantic-ui-react';
import {
  MENU_HEADER_HEIGHT, SHEET_VIEW, VIEW, SHEET_FIT
} from '../utils/constants';
import { truncate } from '../utils/utils';
import styles from './Menu.css';
import stylesPop from './Popup.css';

const Header = ({
  file, visibilitySettings, toggleMovielist, toggleSettings,
  onToggleShowHiddenThumbsClick, settings, onThumbInfoClick,
  openMoviesDialog, toggleZoom, zoom, onSetViewClick,
  onSetSheetFitClick, scaleValueObject, onImportMoviePrint, fileCount, onClearMovieList
}) => {

  const thumbInfoOptions = [
    { value: 'frames', text: 'Show frames', 'data-tid':'framesOption'},
    { value: 'timecode', text: 'Show timecode', 'data-tid':'timecodeOption'},
    { value: 'hideInfo', text: 'Hide info', 'data-tid':'hideInfoOption'},
  ];

  const viewOptions = [
    { value: VIEW.PLAYERVIEW, text: 'Player view', 'data-tid':'playerViewOption' },
    { value: VIEW.STANDARDVIEW, text: 'Standard view', 'data-tid':'standardViewOption' },
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
        {fileCount > 0 &&
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
            mouseEnterDelay={1000}
            position='bottom center'
            className={stylesPop.popup}
            content={(visibilitySettings.showMovielist === false) ? <span>Show Movie and Sheets list <mark>1</mark></span> : <span>Hide Movie list <mark>1</mark></span>}
          />
        }
        <Popup
          trigger={
            <Menu.Item
              data-tid='openMoviesBtn'
              onClick={openMoviesDialog}
            >
              <Icon
                name="folder open outline"
              />
              {file ? 'Add Movies' : 'Add Movies'}
            </Menu.Item>
          }
          mouseEnterDelay={1000}
          position='bottom center'
          className={stylesPop.popup}
          content={<span>Add one or more movies <mark>A</mark></span>}
        />
        <Popup
          trigger={
            <Dropdown
              data-tid='moviesOverflowDropdown'
              item
              icon="ellipsis vertical"
            >
              <Dropdown.Menu>
                <Dropdown.Item
                  data-tid='importMoviesOverflowOption'
                  icon="folder open"
                  text="Import MoviePrint (png/json)"
                  onClick={() => onImportMoviePrint()}
                />
                {fileCount > 0 && <Dropdown.Item
                  data-tid='clearMovieListOverflowOption'
                  icon="delete"
                  text="Clear Movie list"
                  onClick={onClearMovieList}
                />}
              </Dropdown.Menu>
            </Dropdown>
          }
          mouseEnterDelay={1000}
          position='bottom center'
          className={stylesPop.popup}
          content="Import MoviePrint from json file"
        />
        <Menu.Menu position="right">
          {file &&
            visibilitySettings.defaultSheetView === SHEET_VIEW.GRIDVIEW &&
            visibilitySettings.defaultView === VIEW.STANDARDVIEW &&
            visibilitySettings.defaultSheetFit !== SHEET_FIT.HEIGHT &&
            scaleValueObject.moviePrintAspectRatioInv < scaleValueObject.containerAspectRatioInv &&
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
              mouseEnterDelay={1000}
              position='bottom center'
              className={stylesPop.popup}
              content='Fit height'
            />
          }
          {file &&
            visibilitySettings.defaultSheetView === SHEET_VIEW.GRIDVIEW &&
            visibilitySettings.defaultView === VIEW.STANDARDVIEW &&
            visibilitySettings.defaultSheetFit !== SHEET_FIT.WIDTH &&
            scaleValueObject.moviePrintAspectRatioInv > scaleValueObject.containerAspectRatioInv &&
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
              mouseEnterDelay={1000}
              position='bottom center'
              className={stylesPop.popup}
              content='Fit width'
            />
          }
          {file && visibilitySettings.defaultSheetView === SHEET_VIEW.GRIDVIEW &&
            visibilitySettings.defaultView === VIEW.STANDARDVIEW &&
            visibilitySettings.defaultSheetFit !== SHEET_FIT.BOTH &&
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
              mouseEnterDelay={1000}
              position='bottom center'
              className={stylesPop.popup}
              content='Fit all'
            />
          }
          {file && visibilitySettings.defaultSheetView === SHEET_VIEW.GRIDVIEW &&
            visibilitySettings.defaultView === VIEW.STANDARDVIEW &&
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
              mouseEnterDelay={1000}
              position='bottom center'
              className={stylesPop.popup}
              content={zoom ? 'Zoom out' : 'Zoom in'}
            />
          }
          {/* file &&
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
            />
          */}
          {/* file &&
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
            />
          */}
          {file &&
            <Popup
              trigger={
                <Menu.Item
                  data-tid={(visibilitySettings.defaultView === VIEW.STANDARDVIEW) ? 'showPlayerBtn' : 'hidePlayerBtn'}
                  onClick={() => {
                    if (visibilitySettings.defaultView === VIEW.STANDARDVIEW) {
                      onSetViewClick(VIEW.PLAYERVIEW);
                    } else {
                      onSetViewClick(VIEW.STANDARDVIEW);
                    }
                    return undefined;
                  }}
                >
                  <Icon
                    name="youtube play"
                  />
                  {(visibilitySettings.defaultView === VIEW.STANDARDVIEW) ? 'Show player view' : 'Hide player view'}
                </Menu.Item>
              }
              mouseEnterDelay={1000}
              position='bottom center'
              className={stylesPop.popup}
              content={(visibilitySettings.defaultView === VIEW.STANDARDVIEW) ? <span>Show player view <mark>2</mark></span> : <span>Hide player view <mark>2</mark></span>}
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
                {(visibilitySettings.showSettings === false) ? 'Show settings' : 'Hide settings'}
              </Menu.Item>
            }
            mouseEnterDelay={1000}
            position='bottom center'
            className={stylesPop.popup}
            content={(visibilitySettings.showSettings === false) ? <span>Show settings <mark>3</mark></span> : <span>Hide settings <mark>3</mark></span>}
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
