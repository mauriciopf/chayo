import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { useThemedStyles } from '../context/ThemeContext';
import { useKeyboardVisibility } from '../screens/BusinessDetailScreen';

interface TabItem {
  key: string;
  title: string;
  component: React.ReactNode;
}

interface TopTabBarProps {
  tabs: TabItem[];
  initialTab?: string;
}

export const TopTabBar: React.FC<TopTabBarProps> = ({ tabs, initialTab }) => {
  const { theme, fontSizes } = useThemedStyles();
  const [activeTab, setActiveTab] = useState(initialTab || tabs[0]?.key || '');
  const [indicatorPosition] = useState(new Animated.Value(0));
  const defaultHeaderOpacity = useRef(new Animated.Value(1));
  const defaultHeaderTranslateY = useRef(new Animated.Value(0));
  const keyboardContext = useKeyboardVisibility();
  const headerOpacity = keyboardContext?.headerOpacity || defaultHeaderOpacity.current;
  const headerTranslateY = keyboardContext?.headerTranslateY || defaultHeaderTranslateY.current;
  const isKeyboardVisible = keyboardContext?.isKeyboardVisible || false;

  const handleTabPress = (tabKey: string, index: number) => {
    setActiveTab(tabKey);

    // Animate indicator to new position
    Animated.timing(indicatorPosition, {
      toValue: index,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const activeTabContent = tabs.find(tab => tab.key === activeTab);

  // Remove padding when keyboard opens so content fills the space
  const contentPaddingTop = isKeyboardVisible ? 0 : 56;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      {/* Tab Bar - Absolute positioned so it doesn't take flex space */}
      <Animated.View
        style={[
          styles.tabBar,
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            backgroundColor: theme.backgroundColor,
            borderBottomColor: theme.borderColor,
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
        pointerEvents={isKeyboardVisible ? 'none' : 'auto'}
      >
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabButton}
            onPress={() => handleTabPress(tab.key, index)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === tab.key ? theme.primaryColor : theme.placeholderColor,
                  fontWeight: activeTab === tab.key ? '600' : '400',
                  fontSize: fontSizes.base,
                },
              ]}
            >
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Animated Indicator */}
        <Animated.View
          style={[
            styles.indicator,
            {
              backgroundColor: theme.primaryColor,
              left: indicatorPosition.interpolate({
                inputRange: [0, tabs.length - 1],
                outputRange: ['0%', `${(100 / tabs.length) * (tabs.length - 1)}%`],
                extrapolate: 'clamp',
              }),
              width: `${100 / tabs.length}%`,
            },
          ]}
        />
      </Animated.View>

      {/* Tab Content - Dynamic padding based on keyboard state */}
      <View style={[styles.content, { paddingTop: contentPaddingTop, backgroundColor: theme.backgroundColor }]}>
        {activeTabContent?.component}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    height: 56,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 16,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    borderRadius: 1,
  },
  content: {
    flex: 1,
  },
});
