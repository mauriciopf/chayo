/**
 * @format
 */

// PDF-lib polyfills for React Native (must be imported before anything else)
import 'react-native-get-random-values'; // crypto.getRandomValues polyfill

// Expo initialization (required for expo-updates to work properly)
import 'expo/src/Expo.fx';

import {AppRegistry} from 'react-native';
import App from './App';

// Get app name from config
const appName = 'ChayoMobile';

AppRegistry.registerComponent(appName, () => App);
