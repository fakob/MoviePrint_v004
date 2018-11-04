import React from 'react';
import PropTypes from 'prop-types';
import { Menu, Popup, Icon, Dropdown } from 'semantic-ui-react';
import {
  MENU_FOOTER_HEIGHT,
  VIEW,
} from '../utils/constants';
import styles from './Menu.css';
import stylesPop from './Popup.css';

const Footer = ({
  file, visibilitySettings, toggleMovielist, toggleSettings, onSaveMoviePrint,
  savingMoviePrint, defaultView, showFeedbackForm, onOpenFeedbackForm,
  onSaveAllMoviePrints
}) => {

  return (
    <div
      className={`${styles.menu}`}
      style={{
        height: MENU_FOOTER_HEIGHT
      }}
    >
      <Menu
        size="tiny"
        inverted
        // widths={3}
      >
        <Menu.Menu position="right">
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
                Share Feedback
              </Menu.Item>
            }
            className={stylesPop.popup}
            content="Share Feedback"
            keepInViewPort={false}
          />
          {file && defaultView === VIEW.GRIDVIEW &&
            <Popup
              trigger={
                <Menu.Item
                  data-tid='saveMoviePrintBtn'
                  name="save"
                  onClick={onSaveMoviePrint}
                  color="orange"
                  active={!savingMoviePrint}
                  // disabled={savingMoviePrint}
                >
                  { savingMoviePrint ?
                    <Icon
                      loading
                      name="certificate"
                    />
                    :
                    <Icon
                      name="download"
                    />
                  }
                  Save MoviePrint
                </Menu.Item>
              }
              className={stylesPop.popup}
              content="Save MoviePrint"
              keepInViewPort={false}
            />
          }
          {file && defaultView === VIEW.GRIDVIEW &&
            <Popup
              trigger={
                <Dropdown
                  data-tid='saveMoviePrintMoreOptionsDropdown'
                  item
                  floating
                  pointing="bottom right"
                  upward
                  compact
                  icon="caret down"
                  color="orange"
                >
                  <Dropdown.Menu>
                    <Dropdown.Item
                      data-tid='saveAllMoviePrintsOption'
                      icon="download"
                      text="Save All MoviePrints"
                      onClick={onSaveAllMoviePrints}
                    />
                  </Dropdown.Menu>
                </Dropdown>
              }
              className={stylesPop.popup}
              content="More options"
              keepInViewPort={false}
            />
          }
        </Menu.Menu>
      </Menu>
    </div>
  );
};

Footer.defaultProps = {
};

Footer.propTypes = {
  file: PropTypes.object,
};

export default Footer;
