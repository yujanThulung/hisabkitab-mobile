import './src/global.css';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import AppNavigator from './src/navigation/AppNavigator';

const App = () => (
  <>
    <StatusBar style="dark" />
    <AppNavigator />
    <Toast/>
  </>
);

export default App;