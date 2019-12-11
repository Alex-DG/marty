/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';

import {connectToDevTools} from 'react-devtools-core';

const config = {
  host: '192.168.1.64',
  port: 8008,
};

connectToDevTools(config);

AppRegistry.registerComponent(appName, () => App);
