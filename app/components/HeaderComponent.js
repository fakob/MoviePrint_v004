import React from 'react';
import PropTypes from 'prop-types';
import { Menu, Dropdown, Icon, Popup } from 'semantic-ui-react';
import {
  MENU_HEADER_HEIGHT
} from '../utils/constants';
import styles from './Menu.css';
import stylesPop from './Popup.css';

const Header = ({
  file, visibilitySettings, toggleMovielist, toggleSettings,
  onToggleShowHiddenThumbsClick, settings, onThumbInfoClick,
  openMoviesDialog, toggleZoom, zoom, toggleView
}) => {

  const thumbInfoOptions = [
    { value: 'frames', text: 'Show frames', 'data-tid':'framesOption'},
    { value: 'timecode', text: 'Show timecode', 'data-tid':'timecodeOption'},
    { value: 'hideInfo', text: 'Hide info', 'data-tid':'hideInfoOption'},
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
          {file && visibilitySettings.showMoviePrintView && !visibilitySettings.showSettings &&
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
                <Menu.Item
                  data-tid={(visibilitySettings.visibilityFilter === 'SHOW_ALL') ? 'hideHiddenThumbsBtn' : 'showHiddenThumbsBtn'}
                  onClick={onToggleShowHiddenThumbsClick}
                >
                  <Icon
                    name={(visibilitySettings.visibilityFilter === 'SHOW_ALL') ? 'unhide' : 'hide'}
                  />
                  {(visibilitySettings.visibilityFilter === 'SHOW_ALL') ? 'Hide hidden thumbs' : 'Show hidden thumbs'}
                </Menu.Item>
              }
              className={stylesPop.popup}
              content={(visibilitySettings.visibilityFilter === 'SHOW_ALL') ? 'Show all thumbs' : 'Show only visible thumbs'}
              keepInViewPort={false}
            />
          }
          {file &&
            <Popup
              trigger={
                <Dropdown
                  data-tid='showThumbInfoDropdown'
                  text="Show info"
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
          {file && !visibilitySettings.showSettings &&
            <Popup
              trigger={
                <Menu.Item
                  data-tid={visibilitySettings.showMoviePrintView ? 'playerViewBtn' : 'printViewBtn'}
                  onClick={toggleView}
                >
                  <Icon
                    name={visibilitySettings.showMoviePrintView ? 'youtube play' : 'grid layout'}
                  />
                  {visibilitySettings.showMoviePrintView ? 'Player view' : 'Print view'}
                </Menu.Item>
              }
              className={stylesPop.popup}
              content={visibilitySettings.showMoviePrintView ? 'Switch to player view (some video formats can not be played)' : 'Switch to Print view'}
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
