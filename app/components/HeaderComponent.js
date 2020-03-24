import React from 'react';
import PropTypes from 'prop-types';
import { Menu, Dropdown, Icon, Popup } from 'semantic-ui-react';
import {
  MENU_HEADER_HEIGHT,
} from '../utils/constants';
import styles from './Menu.css';
import stylesPop from './Popup.css';

const Header = ({
  file, visibilitySettings, openMoviesDialog, onOpenFeedbackForm,
  onImportMoviePrint, fileCount, onClearMovieList, checkForUpdates,
  isCheckingForUpdates,
}) => {

  return (
    <div
      className={`${styles.container}`}
      style={{
        height: MENU_HEADER_HEIGHT
      }}
    >
      <Menu
        size="tiny"
        inverted
        className={`${styles.menu}`}
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
          on={['hover']}
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
                <Popup
                  trigger={
                    <Dropdown.Item
                      data-tid='importMoviesOverflowOption'
                      icon="folder open"
                      text="Import MoviePrint (png/json)"
                      onClick={() => onImportMoviePrint()}
                    />
                  }
                  mouseEnterDelay={1000}
                  on={['hover']}
                  position='right center'
                  className={stylesPop.popup}
                  content='Import a MoviePrint from JSON file or a PNG file with embedded data'
                />
                {fileCount > 0 &&
                  <Popup
                    trigger={
                      <Dropdown.Item
                        data-tid='clearMovieListOverflowOption'
                        icon="delete"
                        text="Clear Movie list"
                        onClick={onClearMovieList}
                      />
                    }
                    mouseEnterDelay={1000}
                    on={['hover']}
                    position='right center'
                    className={stylesPop.popup}
                    content='Clear Movie list - THIS CAN NOT BE UNDONE!'
                  />
                }
              </Dropdown.Menu>
            </Dropdown>
          }
          mouseEnterDelay={1000}
          on={['hover']}
          position='right center'
          className={stylesPop.popup}
          content="more options"
        />
        <Menu.Menu position="right">
          <Popup
            trigger={
              <Menu.Item
                data-tid='checkForUpdatesBtn'
                onClick={checkForUpdates}
                disabled={isCheckingForUpdates}
              >
                <Icon
                  name="redo"
                />
                Check for updates
              </Menu.Item>
            }
            mouseEnterDelay={1000}
            on={['hover']}
            position='bottom center'
            className={stylesPop.popup}
            content='Check online if there are updates available'
          />
          <Popup
            trigger={
              <Menu.Item
                data-tid='onOpenFeedbackFormBtn'
                name="send"
                onClick={onOpenFeedbackForm}
              >
                <Icon
                  name="mail"
                />
                Contact us
              </Menu.Item>
            }
            mouseEnterDelay={1000}
            on={['hover']}
            position='bottom right'
            offset='0,8px'
            className={stylesPop.popup}
            content="Feedback or feature request? Click here or contact us at support@movieprint.org"
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
