import React from 'react';
import PropTypes from 'prop-types';
import { Menu, Popup, Icon, Dropdown } from 'semantic-ui-react';
import { MENU_FOOTER_HEIGHT, SHEET_VIEW, VIEW } from '../utils/constants';
import styles from './Menu.css';
import stylesPop from './Popup.css';

const Footer = ({
  defaultView,
  file,
  onSaveAllMoviePrints,
  onOpenFileExplorer,
  onSaveMoviePrint,
  savingMoviePrint,
  sheetView,
}) => {
  return (
    <div
      className={`${styles.container}`}
      style={{
        height: MENU_FOOTER_HEIGHT,
      }}
    >
      <Menu
        size="tiny"
        inverted
        className={`${styles.menu}`}
        // widths={3}
      >
        <Menu.Menu position="right">
          {file &&
            (sheetView === SHEET_VIEW.GRIDVIEW || sheetView === SHEET_VIEW.TIMELINEVIEW) &&
            defaultView === VIEW.STANDARDVIEW && (
              <Popup
                trigger={
                  <Menu.Item
                    data-tid="saveMoviePrintBtn"
                    name="save"
                    onClick={onSaveMoviePrint}
                    color="orange"
                    active={!savingMoviePrint}
                    className={styles.saveButton}
                  >
                    {savingMoviePrint ? <div className="ui active inline loader mini" /> : <Icon name="download" />}
                    Save MoviePrint
                  </Menu.Item>
                }
                mouseEnterDelay={1000}
                on={['hover']}
                position="top center"
                offset="0,8px"
                pinned
                className={stylesPop.popup}
                content={
                  <span>
                    Save MoviePrint <mark>M</mark>
                  </span>
                }
              />
            )}
          {file && (
            <Dropdown
              data-tid="saveMoviePrintMoreOptionsDropdown"
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
                  data-tid="openFileExplorerItemOption"
                  icon="external alternate"
                  text="Open output location"
                  onClick={() => onOpenFileExplorer()}
                />
                <Dropdown.Item
                  data-tid="saveAllMoviePrintsOption"
                  icon="download"
                  text="Save All MoviePrints"
                  onClick={onSaveAllMoviePrints}
                />
              </Dropdown.Menu>
            </Dropdown>
          )}
        </Menu.Menu>
      </Menu>
    </div>
  );
};

Footer.defaultProps = {};

Footer.propTypes = {
  file: PropTypes.object,
};

export default Footer;
