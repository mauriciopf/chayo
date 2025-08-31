/**
 * @format
 */

// PDF-lib polyfills for React Native (must be imported before anything else)
import 'react-native-get-random-values'; // crypto.getRandomValues polyfill

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
