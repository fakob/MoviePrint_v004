import React from 'react';
import PropTypes from 'prop-types';
import { Menu, Dropdown, Icon, Loader } from 'semantic-ui-react';
import {
  MINIMUM_WIDTH_TO_SHRINK_HOVER, MINIMUM_WIDTH_TO_SHOW_HOVER,
  VERTICAL_OFFSET_OF_INOUTPOINT_POPUP
} from '../utils/constants';
// import styles from './Footer.css';

const Footer = ({
  file, visibilitySettings, toggleMovielist, toggleSettings, onSaveMoviePrint,
  savingMoviePrint
}) => {

  return (
    <div>
      <Menu
        size="tiny"
        inverted
        // widths={3}
      >
        {/* <Menu.Item
          onClick={toggleMovielist}
        >
          <Icon
            name="list"
          />
          {(visibilitySettings.showMovielist === false) ? 'Show Movie list' : 'Hide Movie list'}
        </Menu.Item> */}
        <Menu.Item>
          {file.name}
        </Menu.Item>
        <Menu.Menu position="right">
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
