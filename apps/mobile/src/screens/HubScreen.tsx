import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemedStyles } from '../context/ThemeContext';
import { useScreenNavigation } from '../context/NavigationContext';
import { useAppConfig } from '../hooks/useAppConfig';
import { useTranslation } from '../hooks/useTranslation';
import Icon from 'react-native-vector-icons/Feather';

// Import all tool screens
import { ProductsScreen } from './ProductsScreen';
import { AppointmentsScreen } from './AppointmentsScreen';
import { FAQsScreen } from './FAQsScreen';
import { PaymentsScreen } from './PaymentsScreen';
import { UnifiedDocumentsSection } from '../components/UnifiedDocumentsSection';


interface HubScreenProps {
  businessName: string;
  onBackToMarketplace: () => void;
  enabledTools: string[];
}

interface ToolConfig {
  name: string;
  label: string;
  icon: string;
  component: React.ComponentType<any>;
}

const toolConfigs: ToolConfig[] = [
  { name: 'products', label: 'Products', icon: 'shopping-bag', component: ProductsScreen },
  { name: 'appointments', label: 'Appointments', icon: 'calendar', component: AppointmentsScreen },
  { name: 'documents_unified', label: 'Documents', icon: 'file-text', component: UnifiedDocumentsSection },
  { name: 'faqs', label: 'FAQs', icon: 'help-circle', component: FAQsScreen },
  { name: 'payments', label: 'Payments', icon: 'credit-card', component: PaymentsScreen },
];

export const HubScreen: React.FC<HubScreenProps> = ({
  businessName,
  onBackToMarketplace: _onBackToMarketplace,
  enabledTools,
}) => {
  const { theme } = useThemedStyles();
  const { config } = useAppConfig();
  const { t: _t } = useTranslation();
  const navigation = useNavigation();
  const { pushNavigationContext, popNavigationContext } = useScreenNavigation();

  // Filter tools based on enabled tools
  const availableTools = toolConfigs.filter(tool => {
    // Special case for unified documents: show if either documents OR intake_forms is enabled
    if (tool.name === 'documents_unified') {
      return enabledTools.includes('documents') || enabledTools.includes('intake_forms');
    }
    return enabledTools.includes(tool.name);
  });
  
  // State for tracking active section
  const [activeToolIndex, setActiveToolIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const topNavScrollRef = useRef<ScrollView>(null);
  const sectionHeights = useRef<number[]>([]);

  // Push Hub context when component mounts
  useEffect(() => {
    pushNavigationContext('hub', businessName);
    
    // Pop Hub context when component unmounts
    return () => {
      popNavigationContext();
    };
  }, [pushNavigationContext, popNavigationContext, businessName]);

  if (!config || availableTools.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        <View style={styles.emptyContainer}>
          <Icon name="grid" size={48} color={theme.textColor + '60'} />
          <Text style={[styles.emptyTitle, { color: theme.textColor }]}>
            No tools available
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.textColor + '80' }]}>
            Contact support to enable business tools
          </Text>
        </View>
      </View>
    );
  }

  // Handle scroll to update active tab
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    let currentSection = 0;
    let accumulatedHeight = 0;

    for (let i = 0; i < sectionHeights.current.length; i++) {
      accumulatedHeight += sectionHeights.current[i];
      if (scrollY < accumulatedHeight - 100) { // 100px offset for better UX
        currentSection = i;
        break;
      }
      currentSection = i;
    }

    // Use functional update to avoid dependency on activeToolIndex
    setActiveToolIndex(prevIndex => {
      if (currentSection !== prevIndex) {
        return currentSection;
      }
      return prevIndex;
    });
  }, []); // No dependencies to prevent infinite re-creation

  // Handle tap on top tab to scroll to section
  const scrollToSection = useCallback((index: number) => {
    setActiveToolIndex(index);
    flatListRef.current?.scrollToIndex({
      index,
      animated: true,
      viewPosition: 0,
    });
  }, []);

  const renderTopTab = (tool: ToolConfig, index: number) => {
    const isActive = index === activeToolIndex;
    
    return (
      <TouchableOpacity
        key={tool.name}
        style={[
          styles.topTab,
          isActive && styles.activeTopTab,
          { borderBottomColor: isActive ? '#F4E4BC' : 'transparent' }
        ]}
        onPress={() => scrollToSection(index)}
        activeOpacity={0.7}
      >
        <Icon 
          name={tool.icon} 
          size={20} 
          color={isActive ? '#F4E4BC' : 'rgba(244, 228, 188, 0.6)'} 
          style={styles.topTabIcon}
        />
        <Text 
          style={[
            styles.topTabLabel,
            { color: isActive ? '#F4E4BC' : 'rgba(244, 228, 188, 0.6)' }
          ]}
        >
          {tool.label}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render each tool as a section
  const renderToolSection = ({ item, index }: { item: ToolConfig; index: number }) => {
    const ToolComponent = item.component;
    
    return (
      <View 
        style={styles.toolSection}
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          sectionHeights.current[index] = height;
        }}
      >
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Icon name={item.icon} size={24} color="#F4E4BC" style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>{item.label}</Text>
        </View>
        
        {/* Tool Component */}
        <View style={styles.toolContainer}>
          <ToolComponent navigation={navigation} />
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      {/* Horizontal Scrollable Top Navigation */}
      <View style={styles.topNavContainer}>
        <ScrollView
          ref={topNavScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topNavContent}
          style={styles.topNavScroll}
        >
          {availableTools.map((tool, index) => renderTopTab(tool, index))}
        </ScrollView>
      </View>

      {/* Unified Scrollable Content */}
      <FlatList
        ref={flatListRef}
        data={availableTools}
        renderItem={renderToolSection}
        keyExtractor={(item) => item.name}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
        getItemLayout={(data, index) => ({
          length: sectionHeights.current[index] || 600, // Estimated height
          offset: sectionHeights.current.slice(0, index).reduce((sum, height) => sum + height, 0),
          index,
        })}
        onScrollToIndexFailed={(info) => {
          // Fallback for scroll to index failures
          const wait = new Promise(resolve => setTimeout(resolve, 500));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
          });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F4E4BC',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: 'rgba(244, 228, 188, 0.8)',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  topNavContainer: {
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 165, 116, 0.1)',
    shadowColor: '#D4A574',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  topNavScroll: {
    flexGrow: 0,
  },
  topNavContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  topTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    minWidth: 100,
  },
  activeTopTab: {
    borderBottomColor: '#F4E4BC',
  },
  topTabIcon: {
    marginRight: 8,
  },
  topTabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(244, 228, 188, 0.6)',
  },
  flatListContent: {
    paddingBottom: 20,
  },
  toolSection: {
    minHeight: 600, // Minimum height for each section
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 165, 116, 0.1)',
    marginBottom: 16,
  },
  sectionIcon: {
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F4E4BC',
    letterSpacing: 0.5,
  },
  toolContainer: {
    flex: 1,
    minHeight: 500, // Ensure each tool has enough space
  },
});
