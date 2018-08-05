import React from 'react';
import PropTypes from 'prop-types';
import { Menu, Popup, Icon, Loader } from 'semantic-ui-react';
import {
  MENU_FOOTER_HEIGHT
} from '../utils/constants';
import styles from './Menu.css';
import stylesPop from './Popup.css';

const Footer = ({
  file, visibilitySettings, toggleMovielist, toggleSettings, onSaveMoviePrint,
  savingMoviePrint, showMoviePrintView, showFeedbackForm, onOpenFeedbackForm,
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
        {/* <Menu.Item>
          {file.name}
        </Menu.Item> */}
        <Menu.Menu position="right">
          <Popup
            trigger={
              <Menu.Item
                name="send"
                onClick={onOpenFeedbackForm}
                // color="orange"
                // active={!savingMoviePrint}
                // disabled={savingMoviePrint}
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
          {file && showMoviePrintView &&
            <Popup
              trigger={
                <Menu.Item
                  name="save"
                  onClick={onSaveAllMoviePrints}
                  color="blue"
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
                  Save All MoviePrints
                </Menu.Item>
              }
              className={stylesPop.popup}
              content="Save the MoviePrints of all Movies"
              keepInViewPort={false}
            />
          }
          {file && showMoviePrintView &&
            <Popup
              trigger={
                <Menu.Item
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
