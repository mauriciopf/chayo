import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  SafeAreaView,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import LoadingScreen from './LoadingScreen';
import { useTranslation } from '../hooks/useTranslation';

interface WebViewScreenProps {
  url: string;
  title?: string;
  onNavigationStateChange?: (navState: WebViewNavigation) => void;
  showRefreshControl?: boolean;
}

export const WebViewScreen: React.FC<WebViewScreenProps> = ({
  url,
  title,
  onNavigationStateChange,
  showRefreshControl = true,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);

  const handleLoadStart = () => {
    setLoading(true);
    setError(null);
  };

  const handleLoadEnd = () => {
    setLoading(false);
    setRefreshing(false);
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    setLoading(false);
    setRefreshing(false);
    setError(nativeEvent.description || t('errors.networkError'));
    
    Alert.alert(
      t('common.error'),
      t('errors.networkError'),
      [
        { text: t('common.retry'), onPress: () => webViewRef.current?.reload() },
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  };

  const handleRefresh = () => {
    setRefreshing(true);
    webViewRef.current?.reload();
  };

  const injectedJavaScript = `
    // Hide navigation elements for mobile optimization
    (function() {
      const style = document.createElement('style');
      style.textContent = \`
        /* Hide common navigation elements */
        nav, .nav, .navbar, .navigation,
        header, .header, .site-header,
        .mobile-hide, [data-mobile="hide"] {
          display: none !important;
        }
        
        /* Optimize for mobile */
        body {
          padding-top: 0 !important;
          margin-top: 0 !important;
        }
        
        /* Improve touch targets */
        button, a, input, select, textarea {
          min-height: 44px;
          min-width: 44px;
        }
      \`;
      document.head.appendChild(style);
    })();
    true;
  `;

  return (
    <SafeAreaView style={styles.container}>
      {showRefreshControl && (
        <ScrollView
          contentContainerStyle={{ flex: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <WebView
            ref={webViewRef}
            source={{ uri: url }}
            style={styles.webview}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
            onNavigationStateChange={onNavigationStateChange}
            injectedJavaScript={injectedJavaScript}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            scalesPageToFit={true}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            allowsBackForwardNavigationGestures={true}
            mixedContentMode="compatibility"
            userAgent="ChayoMobile/1.0 (Mobile App)"
          />
        </ScrollView>
      )}
      
      {!showRefreshControl && (
        <WebView
          ref={webViewRef}
          source={{ uri: url }}
          style={styles.webview}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          onNavigationStateChange={onNavigationStateChange}
          injectedJavaScript={injectedJavaScript}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
          scalesPageToFit={true}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          allowsBackForwardNavigationGestures={true}
          mixedContentMode="compatibility"
          userAgent="ChayoMobile/1.0 (Mobile App)"
        />
      )}

      {loading && (
        <LoadingScreen />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
});