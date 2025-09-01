import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { withTheme, useThemedStyles, ThemeColors } from '../context/ThemeContext';

// Example 1: Using HOC approach
interface ThemedButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  theme: ThemeColors;
  themedStyles: any;
}

const ThemedButtonComponent: React.FC<ThemedButtonProps> = ({ 
  title, 
  onPress, 
  variant = 'primary',
  theme,
  themedStyles 
}) => {
  const buttonStyle = variant === 'primary' ? themedStyles.primaryButton : themedStyles.secondaryButton;
  
  return (
    <TouchableOpacity style={buttonStyle} onPress={onPress}>
      <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

// Export the themed version using HOC
export const ThemedButton = withTheme(ThemedButtonComponent);

// Example 2: Using hook approach (recommended)
interface ThemedCardProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export const ThemedCard: React.FC<ThemedCardProps> = ({ title, subtitle, children }) => {
  const { theme, themedStyles } = useThemedStyles();
  
  return (
    <View style={[styles.card, themedStyles.surface, themedStyles.border]}>
      <Text style={[styles.cardTitle, themedStyles.primaryText]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[styles.cardSubtitle, themedStyles.secondaryText]}>
          {subtitle}
        </Text>
      )}
      {children}
    </View>
  );
};

// Example 3: Themed Input
interface ThemedInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
}

export const ThemedInput: React.FC<ThemedInputProps> = ({ 
  placeholder, 
  value, 
  onChangeText, 
  multiline = false 
}) => {
  const { theme, themedStyles } = useThemedStyles();
  
  return (
    <TextInput
      style={[
        themedStyles.input,
        multiline && styles.multilineInput
      ]}
      placeholder={placeholder}
      placeholderTextColor={theme.placeholderColor}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
    />
  );
};

// Example 4: Themed Container
interface ThemedContainerProps {
  children: React.ReactNode;
  variant?: 'main' | 'surface';
}

export const ThemedContainer: React.FC<ThemedContainerProps> = ({ 
  children, 
  variant = 'main' 
}) => {
  const { themedStyles } = useThemedStyles();
  
  const containerStyle = variant === 'main' ? themedStyles.container : themedStyles.surface;
  
  return (
    <View style={[styles.container, containerStyle]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  container: {
    flex: 1,
  },
});
