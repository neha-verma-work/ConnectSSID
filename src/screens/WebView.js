import React from 'react';
import { WebView } from 'react-native-webview';

const MyWebBrowser = () => {
  return (
    <WebView
      source={{ uri: 'https://www.npmjs.com/package/react-native-webview' }}
      style={{ flex: 1 }}
    />
  );
};

export default MyWebBrowser;