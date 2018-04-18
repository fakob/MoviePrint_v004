import React from 'react';
import PropTypes from 'prop-types';
import { Menu, Dropdown, Icon } from 'semantic-ui-react';
import {
  MINIMUM_WIDTH_TO_SHRINK_HOVER, MINIMUM_WIDTH_TO_SHOW_HOVER,
  VERTICAL_OFFSET_OF_INOUTPOINT_POPUP
} from '../utils/constants';
import styles from './Header.css';

const Header = ({
  file, visibilitySettings, toggleMovielist, toggleSettings
}) => {

  return (
    <div>
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
        <Menu.Item>
          {file.name}
        </Menu.Item>
        <Menu.Menu position="right">
          <Menu.Item>
            <Icon
              name="unhide"
            />
            Show hidden
          </Menu.Item>
          <Dropdown item text="Show info">
            <Dropdown.Menu>
              <Dropdown.Item>Show frames</Dropdown.Item>
              <Dropdown.Item>Show timecode</Dropdown.Item>
              <Dropdown.Item>Hide info</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
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
