import React from 'react';
import PropTypes from 'prop-types';
import { Menu, Dropdown, Icon, Popup } from 'semantic-ui-react';
import {
  MENU_HEADER_HEIGHT,
} from '../utils/constants';
import styles from './Menu.css';
import stylesPop from './Popup.css';

const Header = ({
  file, visibilitySettings, openMoviesDialog,
  onImportMoviePrint, fileCount, onClearMovieList
}) => {

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
