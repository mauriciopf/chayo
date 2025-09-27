import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { useThemedStyles } from '../context/ThemeContext';

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

  return (
    <View style={styles.container}>
      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: theme.backgroundColor, borderBottomColor: theme.borderColor }]}>
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
                }
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
            }
          ]}
        />
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
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
    position: 'relative',
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
