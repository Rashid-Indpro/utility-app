import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';

// Screens
import HomeScreen from '@/screens/HomeScreen';
import ToolScreen from '@/screens/ToolScreen';
import HistoryScreen from '@/screens/HistoryScreen';
import InternalWebViewScreen from '@/screens/InternalWebViewScreen';

// Drawer Content
import CustomDrawerContent from './CustomDrawerContent';

// Types
import type { HistoryItem } from '../utils/storage';

export type RootStackParamList = {
  Main: undefined;
  Tool: {
    toolName: string;
    toolType: 'crop' | 'resize' | 'compress' | 'filters' | 'watermark' | 'text' | 'converter' | 'metadata' | 'background';
    historyItem?: HistoryItem;
  };
  History: undefined;
  WebView: {
    url: string;
    title: string;
  };
};

export type DrawerParamList = {
  Home: undefined;
  Team: undefined;
  Privacy: undefined;
  Terms: undefined;
  Contact: undefined;
  FollowUs: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

// Main Stack Navigator
const MainStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        presentation: 'card',
        animationTypeForReplace: 'push',
      }}
    >
      <Stack.Screen name="Main" component={HomeScreen} />
      <Stack.Screen 
        name="Tool" 
        component={ToolScreen}
        options={{
          animationEnabled: true,
          cardStyleInterpolator: ({ current, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
              },
            };
          },
        }}
      />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen 
        name="WebView" 
        component={InternalWebViewScreen}
        options={{
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
};

// Main App Navigator with Drawer
const AppNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        drawerPosition: 'left',
        drawerStyle: {
          width: 280,
        },
        overlayColor: 'rgba(0, 0, 0, 0.5)',
        sceneContainerStyle: {
          backgroundColor: 'transparent',
        },
      }}
    >
      <Drawer.Screen name="Home" component={MainStack} />
    </Drawer.Navigator>
  );
};

export default AppNavigator;