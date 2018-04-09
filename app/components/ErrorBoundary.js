import React, { Component } from 'react';
import { Button, Divider } from 'semantic-ui-react';
import styles from './ErrorBoundary.css';

const { getCurrentWindow } = require('electron').remote;

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };

    this.onRefreshClick = this.onRefreshClick.bind(this);
    this.onRestartClick = this.onRestartClick.bind(this);
  }

  componentDidCatch(error, info) {
    // Display fallback UI
    this.setState({ hasError: true });
    // You can also log the error to an error reporting service
    console.log(error);
    console.log(info);
  }

  onRefreshClick() {
    console.log('refreshclick');
    getCurrentWindow().reload();
    // location.reload(false);
  }

  onRestartClick() {
    console.log('restartclick')
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
                content="Restart"
                onClick={this.onRestartClick}
              />
              <Button.Or />
              <Button
                positive
                content="Refresh"
                onClick={this.onRefreshClick}
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
