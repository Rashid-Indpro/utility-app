import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Text } from '@/components';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, Spacing } from '@/constants/theme';
import { RootStackParamList } from '@/navigation/AppNavigator';

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'WebView'>;
  route: RouteProp<RootStackParamList, 'WebView'>;
}

const InternalWebViewScreen: React.FC<Props> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { url, title } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState(url);
  const webViewRef = useRef<WebView>(null);
  
  const goBack = () => {
    navigation.goBack();
  };
  
  const refreshPage = () => {
    setError(null);
    setLoading(true);
    webViewRef.current?.reload();
  };
  
  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    const { url: newUrl } = navState;
    setCurrentUrl(newUrl);
    
    // Block external redirects - only allow interaminds.com
    if (!newUrl.includes('interaminds.com')) {
      webViewRef.current?.stopLoading();
      Alert.alert(
        'Navigation Blocked',
        'This app only allows access to InteraMinds content for security reasons.',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    return true;
  };
  
  const handleShouldStartLoad = (request: any) => {
    const { url: requestUrl } = request;
    
    // Only allow interaminds.com domain
    if (!requestUrl.includes('interaminds.com')) {
      Alert.alert(
        'External Link Blocked',
        'External links are not allowed for your privacy and security.',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    return true;
  };
  
  const handleLoadStart = () => {
    setLoading(true);
    setError(null);
  };
  
  const handleLoadEnd = () => {
    setLoading(false);
  };
  
  const handleError = () => {
    setLoading(false);
    setError('Failed to load page. Please check your internet connection.');
  };
  
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={Colors.primary.start}
          translucent={false}
        />
        
        {/* Header */}
        <LinearGradient
          colors={[Colors.primary.start, Colors.primary.end]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <MaterialIcons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text variant="h4" style={styles.headerTitle}>
              {title}
            </Text>
          </View>
          
          <TouchableOpacity onPress={refreshPage} style={styles.actionButton}>
            <MaterialIcons name="refresh" size={24} color="#ffffff" />
          </TouchableOpacity>
        </LinearGradient>
        
        {/* Error Screen */}
        <View style={styles.errorContainer}>
          <MaterialIcons 
            name="error-outline" 
            size={64} 
            color={Colors.status.error} 
            style={styles.errorIcon}
          />
          <Text variant="h4" color="secondary" align="center">
            Oops! Something went wrong
          </Text>
          <Text variant="body" color="tertiary" align="center" style={styles.errorText}>
            {error}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={refreshPage}
          >
            <Text variant="button" style={styles.retryButtonText}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primary.start}
        translucent={false}
      />
      
      {/* Header */}
      <LinearGradient
        colors={[Colors.primary.start, Colors.primary.end]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <MaterialIcons name="close" size={24} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text variant="h4" style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>
        
        <TouchableOpacity onPress={refreshPage} style={styles.actionButton}>
          <MaterialIcons name="refresh" size={24} color="#ffffff" />
        </TouchableOpacity>
      </LinearGradient>
      
      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.main} />
          <Text variant="body" color="secondary" style={styles.loadingText}>
            Loading...
          </Text>
        </View>
      )}
      
      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={styles.webview}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scalesPageToFit={true}
        allowsInlineMediaPlayback={true}
        // Security settings
        allowUniversalAccessFromFileURLs={false}
        allowFileAccessFromFileURLs={false}
        mixedContentMode="never"
      />
      
      {/* Privacy Notice */}
      <View style={styles.privacyNotice}>
        <MaterialIcons 
          name="security" 
          size={16} 
          color={Colors.accent.main} 
          style={styles.privacyIcon}
        />
        <Text variant="caption" color="tertiary" style={styles.privacyText}>
          Secure connection to interaminds.com
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  headerTitle: {
    color: '#ffffff',
    fontWeight: '600',
  },
  actionButton: {
    padding: Spacing.sm,
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.sm,
  },
  webview: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorIcon: {
    marginBottom: Spacing.lg,
  },
  errorText: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(248, 250, 252, 0.95)',
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  privacyIcon: {
    marginRight: Spacing.xs,
  },
  privacyText: {
    fontSize: 12,
  },
});

export default InternalWebViewScreen;