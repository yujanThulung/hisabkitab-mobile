import './src/global.css';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';

const App = () => (
  <>
    <StatusBar style="dark" />
    <AppNavigator />
  </>
);

export default App;