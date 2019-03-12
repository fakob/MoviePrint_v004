import React, { Component } from 'react';
import { Button, Divider } from 'semantic-ui-react';
import log from 'electron-log';
import styles from './ErrorBoundary.css';

const { ipcRenderer } = require('electron');

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };

    this.onReloadClick = this.onReloadClick.bind(this);
    this.onResetClick = this.onResetClick.bind(this);
  }

  componentDidCatch(error, info) {
    // Display fallback UI
    this.setState({ hasError: true });
    // You can also log the error to an error reporting service
    log.error(error);
    log.warn(info);
  }

  onReloadClick() {
    log.info('reloadclick');
    ipcRenderer.send('reload-application');
  }

  onResetClick() {
    log.info('resetclick');
    ipcRenderer.send('reset-application');
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className={`${styles.ErrorContainer}`}>
          <div className={`${styles.ErrorContent}`}>
            SOMETHING WENT WRONG
            {/* <Divider /> */}
            <Button.Group
              size="huge"
              // compact
              style={{
                // marginRight: '20px'
              }}
            >
              <Button
                content="Reset"
                onClick={this.onResetClick}
              />
              <Button.Or />
              <Button
                positive
                content="Reload"
                onClick={this.onReloadClick}
              />
            </Button.Group>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
