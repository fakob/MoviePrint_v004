import React from 'react';
import PropTypes from 'prop-types';
import { Menu, Dropdown, Icon, Loader } from 'semantic-ui-react';
import {
  MENU_FOOTER_HEIGHT
} from '../utils/constants';
import styles from './Menu.css';

const Footer = ({
  file, visibilitySettings, toggleMovielist, toggleSettings, onSaveMoviePrint,
  savingMoviePrint, showMoviePrintView
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
        {/* <Menu.Item>
          {file.name}
        </Menu.Item> */}
        <Menu.Menu position="right">
          {showMoviePrintView &&
            <Menu.Item
              name="save"
              onClick={onSaveMoviePrint}
              color="orange"
              active={!savingMoviePrint}
              // className={styles.FixedActionMenuFlex}
              disabled={savingMoviePrint}
            >
              { savingMoviePrint ?
                <Loader
                  active
                  inline
                  size="small"
                />
                :
                <Icon
                  name="save"
                />
              }
              Save MoviePrint
            </Menu.Item>
          }
        </Menu.Menu>
      </Menu>
    </div>
  );
};

Footer.defaultProps = {
  file: {
    name: 'I am a default name'
  }
};

Footer.propTypes = {
  file: PropTypes.object,
};

export default Footer;
