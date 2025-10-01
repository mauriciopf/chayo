import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemedStyles } from '../context/ThemeContext';
import { useScreenNavigation } from '../context/NavigationContext';
import { useAppConfig } from '../hooks/useAppConfig';
import Icon from 'react-native-vector-icons/Feather';

// Import all tool screens
import { ProductsScreen } from './ProductsScreen';
import { AppointmentsScreen } from './AppointmentsScreen';
import { FAQsScreen } from './FAQsScreen';
import { PaymentsScreen } from './PaymentsScreen';
import { UnifiedDocumentsSection } from '../components/UnifiedDocumentsSection';
import { SkeletonBox } from '../components/SkeletonLoader';


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
  { name: 'products', label: 'Productos', icon: 'shopping-bag', component: ProductsScreen },
  { name: 'appointments', label: 'Citas', icon: 'calendar', component: AppointmentsScreen },
  { name: 'documents_unified', label: 'Documentos', icon: 'file-text', component: UnifiedDocumentsSection },
  { name: 'faqs', label: 'Preguntas', icon: 'help-circle', component: FAQsScreen },
  { name: 'payments', label: 'Pagos', icon: 'credit-card', component: PaymentsScreen },
];

export const HubScreen: React.FC<HubScreenProps> = ({
  businessName,
  onBackToMarketplace: _onBackToMarketplace,
  enabledTools,
}) => {
  const { theme, fontSizes } = useThemedStyles();
  const { config } = useAppConfig();
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

  // Push Hub context when component mounts
  useEffect(() => {
    pushNavigationContext('hub', businessName);

    // Pop Hub context when component unmounts
    return () => {
      popNavigationContext();
    };
  }, [pushNavigationContext, popNavigationContext, businessName]);

  // Show hub immediately, even if config is still loading
  if (!config) {
    // Show hub with skeleton loading state
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        <View style={styles.topNavContainer}>
          <View style={styles.topNavContent}>
            <SkeletonBox width={80} height={60} borderRadius={12} style={styles.skeletonMarginRight} />
            <SkeletonBox width={80} height={60} borderRadius={12} style={styles.skeletonMarginRight} />
            <SkeletonBox width={80} height={60} borderRadius={12} />
          </View>
        </View>
        <View style={styles.skeletonContent}>
          <View style={styles.skeletonSection}>
            <SkeletonBox width={200} height={24} borderRadius={8} style={styles.skeletonMarginBottom} />
            <SkeletonBox width={300} height={200} borderRadius={16} />
          </View>
          <View style={styles.skeletonSection}>
            <SkeletonBox width={180} height={24} borderRadius={8} style={styles.skeletonMarginBottom} />
            <SkeletonBox width={300} height={200} borderRadius={16} />
          </View>
        </View>
      </View>
    );
  }

  if (availableTools.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        <View style={styles.emptyContainer}>
          <Icon name="grid" size={48} color={theme.textColor + '60'} />
          <Text style={[styles.emptyTitle, { color: theme.textColor, fontSize: fontSizes.xl }]}>
            No hay herramientas disponibles
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.textColor + '80', fontSize: fontSizes.base }]}>
            Contacta a soporte para habilitar herramientas de negocio
          </Text>
        </View>
      </View>
    );
  }

  const renderTopTab = (tool: ToolConfig, index: number) => {
    const isActive = index === activeToolIndex;

    return (
      <TouchableOpacity
        key={tool.name}
        style={[
          styles.topTab,
          isActive && styles.activeTopTab,
        ]}
        onPress={() => scrollToSection(index)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.topTabIconContainer,
          isActive && styles.activeTopTabIconContainer,
        ]}>
          <Icon
            name={tool.icon}
            size={18}
            color={isActive ? '#1A1A1A' : '#F4E4BC'}
          />
        </View>
        <Text
          style={[
            styles.topTabLabel,
            isActive ? styles.activeTopTabLabel : styles.inactiveTopTabLabel,
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
        {/* Enhanced Section Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <View style={styles.sectionIconContainer}>
              <Icon name={item.icon} size={22} color="#F4E4BC" />
            </View>
            <View>
              <Text style={[styles.sectionTitle, { fontSize: fontSizes.lg }]}>{item.label}</Text>
              <Text style={[styles.sectionSubtitle, { fontSize: fontSizes.sm }]}>Explora {item.label.toLowerCase()}</Text>
            </View>
          </View>
          <View style={styles.sectionHeaderRight}>
            <Icon name="chevron-down" size={16} color="rgba(244, 228, 188, 0.4)" />
          </View>
        </View>

        {/* Tool Component with enhanced container */}
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
    borderBottomColor: 'rgba(244, 228, 188, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  topNavScroll: {
    flexGrow: 0,
  },
  topNavContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  topTab: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 12,
    minWidth: 80,
  },
  activeTopTab: {
    backgroundColor: 'rgba(244, 228, 188, 0.1)',
  },
  topTabIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(244, 228, 188, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  activeTopTabIconContainer: {
    backgroundColor: '#F4E4BC',
  },
  topTabLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  activeTopTabLabel: {
    color: '#F4E4BC',
  },
  inactiveTopTabLabel: {
    color: 'rgba(244, 228, 188, 0.6)',
  },
  flatListContent: {
    paddingBottom: 20,
  },
  toolSection: {
    minHeight: 600,
    paddingVertical: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(244, 228, 188, 0.02)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(244, 228, 188, 0.08)',
    marginBottom: 8,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeaderRight: {
    opacity: 0.6,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(244, 228, 188, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F4E4BC',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: 'rgba(244, 228, 188, 0.6)',
    fontWeight: '500',
  },
  toolContainer: {
    flex: 1,
    minHeight: 500,
    paddingHorizontal: 4,
  },
  skeletonContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  skeletonSection: {
    marginBottom: 32,
  },
  skeletonMarginRight: {
    marginRight: 8,
  },
  skeletonMarginBottom: {
    marginBottom: 16,
  },
});
