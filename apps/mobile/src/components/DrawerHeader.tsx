import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useThemedStyles } from '../context/ThemeContext';

interface DrawerHeaderProps {
  navigation: any;
  title: string;
}

export const DrawerHeader: React.FC<DrawerHeaderProps> = ({ navigation, title }) => {
  const { theme, fontSizes } = useThemedStyles();

  return (
    <View style={[styles.header, { backgroundColor: theme.backgroundColor, borderBottomColor: theme.borderColor }]}>
      {/* Hamburger menu button - LEFT */}
      <TouchableOpacity
        onPress={() => navigation.openDrawer()}
        style={styles.hamburgerButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon name="menu" size={24} color={theme.textColor} />
      </TouchableOpacity>

      {/* Title - LEFT ALIGNED */}
      <Text style={[styles.headerTitle, { color: theme.textColor, fontSize: fontSizes.xl }]} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  hamburgerButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontWeight: '700',
    flex: 1,
  },
});

