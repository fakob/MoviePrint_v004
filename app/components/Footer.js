import React from 'react';
import PropTypes from 'prop-types';
import { Menu, Popup, Icon, Dropdown } from 'semantic-ui-react';
import {
  MENU_FOOTER_HEIGHT,
  SHEET_VIEW,
  VIEW,
} from '../utils/constants';
import styles from './Menu.css';
import stylesPop from './Popup.css';

const Footer = ({
  file, visibilitySettings, toggleMovielist, toggleSettings, onSaveMoviePrint,
  savingMoviePrint, defaultSheetView, showFeedbackForm, onOpenFeedbackForm,
  onSaveAllMoviePrints, defaultView
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
            mouseEnterDelay={1000}
            position='top center'
            offset='0,8px'
            className={stylesPop.popup}
            content="Share Feedback"
          />
          {file &&
            (defaultSheetView === SHEET_VIEW.GRIDVIEW || defaultSheetView === SHEET_VIEW.TIMELINEVIEW) &&
            defaultView === VIEW.STANDARDVIEW &&
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
              mouseEnterDelay={1000}
              position='top center'
              offset='0,8px'
              pinned
              className={stylesPop.popup}
              content={<span>Save MoviePrint <mark>M</mark></span>}
            />
          }
          {file &&
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
              mouseEnterDelay={1000}
              position='top right'
              offset='0,8px'
              pinned
              className={stylesPop.popup}
              content="More options"
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
