import React, { useState, useRef, useEffect, forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useThemedStyles } from '../context/ThemeContext';

interface ModernFloatingInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  error?: string;
  required?: boolean;
  editable?: boolean;
  icon?: string;
  onPress?: () => void; // For select fields that open pickers
  onSubmitEditing?: () => void;
  returnKeyType?: 'done' | 'next' | 'send' | 'go' | 'search';
  blurOnSubmit?: boolean;
  inputAccessoryView?: React.ReactElement;
  showSoftInputOnFocus?: boolean;
}

export const ModernFloatingInput = forwardRef<TextInput, ModernFloatingInputProps>(({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  error,
  required = false,
  editable = true,
  icon,
  onPress,
  onSubmitEditing,
  returnKeyType = 'done',
  blurOnSubmit = true,
  inputAccessoryView: _inputAccessoryView,
  showSoftInputOnFocus = true,
}, ref) => {
  const { theme, fontSizes } = useThemedStyles();
  const [isFocused, setIsFocused] = useState(false);
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value, animatedValue]);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const labelStyle = {
    position: 'absolute' as const,
    left: 16,
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [20, 8],
    }),
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [theme.placeholderColor, isFocused ? theme.primaryColor : theme.placeholderColor],
    }),
    backgroundColor: isFocused ? theme.backgroundColor : 'rgba(28, 28, 30, 0.9)',
    paddingHorizontal: 4,
    zIndex: 1,
    opacity: label ? 1 : 0, // Hide label if empty
  };

  const containerStyle = [
    styles.container,
    {
      borderColor: error
        ? theme.errorColor
        : isFocused
          ? theme.primaryColor
          : 'rgba(255, 255, 255, 0.1)',
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      shadowColor: 'rgba(255, 255, 255, 0.1)',
    },
    error && styles.errorContainer,
    isFocused && styles.focusedContainer,
  ];

  const inputStyle = [
    styles.input,
    {
      color: theme.textColor,
      fontSize: fontSizes.base,
      paddingTop: multiline ? (label ? 24 : 16) : (label ? 20 : 16),
    },
    multiline && { height: numberOfLines * 24 + 40 },
  ];

  // If it's a select field (has onPress), render as TouchableOpacity
  if (onPress) {
    return (
      <View style={styles.fieldContainer}>
        <TouchableOpacity onPress={onPress} style={containerStyle}>
          <Animated.Text style={labelStyle}>
            {label}
            {required && <Text style={{ color: theme.errorColor, fontSize: fontSizes.base }}> *</Text>}
          </Animated.Text>

          <View style={[styles.input, { paddingTop: 20, justifyContent: 'center' }]}>
            <Text style={[
              styles.selectText,
              {
                color: value ? theme.textColor : theme.placeholderColor,
                fontSize: fontSizes.base,
              },
            ]}>
              {value || placeholder || 'Select an option'}
            </Text>
          </View>

          {icon && (
            <View style={styles.iconContainer}>
              <Text style={[styles.icon, { color: theme.placeholderColor, fontSize: fontSizes.base }]}>
                {icon}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {error && (
          <Text style={[styles.errorText, { color: theme.errorColor, fontSize: fontSizes.xs }]}>
            {error}
          </Text>
        )}
      </View>
    );
  }

  // Regular text input
  return (
    <View style={styles.fieldContainer}>
      <View style={containerStyle}>
        <Animated.Text style={labelStyle}>
          {label}
          {required && <Text style={{ color: theme.errorColor }}> *</Text>}
        </Animated.Text>

        <TextInput
          ref={ref}
          style={inputStyle}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={onSubmitEditing}
          placeholder={isFocused ? '' : placeholder}
          placeholderTextColor={theme.placeholderColor}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          keyboardAppearance="dark"
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
          autoCorrect={keyboardType !== 'email-address'}
          returnKeyType={returnKeyType}
          blurOnSubmit={blurOnSubmit}
          inputAccessoryViewID={Platform.OS === 'ios' ? 'formNavigation' : undefined}
          showSoftInputOnFocus={showSoftInputOnFocus}
        />

        {icon && (
          <View style={styles.iconContainer}>
            <Text style={[styles.icon, { color: theme.placeholderColor }]}>
              {icon}
            </Text>
          </View>
        )}
      </View>

      {error && (
        <Text style={[styles.errorText, { color: theme.errorColor }]}>
          {error}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: 24,
  },
  container: {
    borderWidth: 1,
    borderRadius: 16,
    position: 'relative',
    minHeight: 56,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  focusedContainer: {
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 2,
  },
  errorContainer: {
    borderWidth: 2,
    shadowColor: 'rgba(255, 69, 58, 0.3)',
  },
  input: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    fontSize: 16,
    minHeight: 40,
  },
  selectText: {
    fontSize: 16,
  },
  iconContainer: {
    position: 'absolute',
    right: 16,
    top: 20,
  },
  icon: {
    fontSize: 20,
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 16,
    fontWeight: '500',
  },
});
