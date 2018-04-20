import React from 'react';
import PropTypes from 'prop-types';
import { Menu, Dropdown, Icon } from 'semantic-ui-react';
import {
  MENU_HEADER_HEIGHT
} from '../utils/constants';
import styles from './Menu.css';

const Header = ({
  file, visibilitySettings, toggleMovielist, toggleSettings,
  onToggleShowHiddenThumbsClick, settings, onThumbInfoClick,
  openDialog, toggleZoom
}) => {

  const thumbInfoOptions = [
    { value: 'frames', text: 'Show frames', },
    { value: 'timecode', text: 'Show timecode', },
    { value: 'hideInfo', text: 'Hide info' },
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
        <Menu.Item
          onClick={toggleMovielist}
        >
          <Icon
            name="list"
          />
          {(visibilitySettings.showMovielist === false) ? 'Show Movie list' : 'Hide Movie list'}
        </Menu.Item>
        <Menu.Item
          onClick={openDialog}
        >
          Open Movies
        </Menu.Item>
        {/* <Menu.Item>
          {file.name}
        </Menu.Item> */}
        <Menu.Menu position="right">
          <Menu.Item
            onClick={toggleZoom}
          >
            <Icon
              name="zoom"
            />
            Zoom
          </Menu.Item>
          <Menu.Item
            onClick={onToggleShowHiddenThumbsClick}
          >
            <Icon
              name={(visibilitySettings.visibilityFilter === 'SHOW_ALL') ? 'unhide' : 'hide'}
            />
            {(visibilitySettings.visibilityFilter === 'SHOW_ALL') ? 'Hide thumbs' : 'Show thumbs'}
          </Menu.Item>
          <Dropdown
            text="Show info"
            item
            options={thumbInfoOptions}
            value={settings.defaultThumbInfo}
            onChange={(e, { value }) => onThumbInfoClick(value)}
          />
          <Menu.Item
            onClick={toggleSettings}
          >
            <Icon
              name="edit"
            />
            {(visibilitySettings.showSettings === false) ? 'More settings' : 'Hide settings'}
          </Menu.Item>
        </Menu.Menu>
      </Menu>
    </div>
  );
};

Header.defaultProps = {
  file: {
    name: 'I am a default name'
  }
};

Header.propTypes = {
  file: PropTypes.object,
};

export default Header;
