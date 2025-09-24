import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useThemedStyles } from '../context/ThemeContext';
import { useAppConfig } from '../hooks/useAppConfig';
import { useTranslation } from '../hooks/useTranslation';
import Icon from 'react-native-vector-icons/Feather';

// Import all tool screens
import { ProductsScreen } from './ProductsScreen';
import { AppointmentsScreen } from './AppointmentsScreen';
import { DocumentsScreen } from './DocumentsScreen';
import { FAQsScreen } from './FAQsScreen';
import { IntakeFormsScreen } from './IntakeFormsScreen';
import { PaymentsScreen } from './PaymentsScreen';

const { width } = Dimensions.get('window');

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
  { name: 'documents', label: 'Documents', icon: 'file-text', component: DocumentsScreen },
  { name: 'faqs', label: 'FAQs', icon: 'help-circle', component: FAQsScreen },
  { name: 'intake_forms', label: 'Forms', icon: 'clipboard', component: IntakeFormsScreen },
  { name: 'payments', label: 'Payments', icon: 'credit-card', component: PaymentsScreen },
];

export const HubScreen: React.FC<HubScreenProps> = ({
  businessName,
  onBackToMarketplace,
  enabledTools,
}) => {
  const { theme } = useThemedStyles();
  const { config } = useAppConfig();
  const { t } = useTranslation();

  // Filter tools based on enabled tools
  const availableTools = toolConfigs.filter(tool => enabledTools.includes(tool.name));
  
  // Default to first available tool
  const [activeToolIndex, setActiveToolIndex] = useState(0);
  const activeTool = availableTools[activeToolIndex];

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
        onPress={() => setActiveToolIndex(index)}
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

  const ActiveComponent = activeTool.component;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      {/* Horizontal Scrollable Top Navigation */}
      <View style={styles.topNavContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topNavContent}
          style={styles.topNavScroll}
        >
          {availableTools.map((tool, index) => renderTopTab(tool, index))}
        </ScrollView>
      </View>

      {/* Active Tool Content */}
      <View style={styles.contentContainer}>
        <ActiveComponent />
      </View>
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
  contentContainer: {
    flex: 1,
  },
});
