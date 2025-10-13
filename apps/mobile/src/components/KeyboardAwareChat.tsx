import React, { ReactNode } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ListRenderItem,
  Keyboard,
} from 'react-native';
import { useKeyboardVisibility } from '../screens/BusinessDetailScreen';

interface KeyboardAwareChatProps<T> {
  // FlatList props
  data: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  onContentSizeChange?: () => void;
  flatListRef?: React.RefObject<FlatList<T>>;
  ListFooterComponent?: ReactNode;

  // Input props
  inputValue: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onSend: () => void;
  inputRef?: React.RefObject<TextInput>;
  placeholder?: string;
  sendDisabled?: boolean;
  sendButtonContent?: ReactNode;

  // Theme props
  backgroundColor: string;
  inputBackgroundColor: string;
  textColor: string;
  borderColor: string;
  focusBorderColor: string;
  placeholderColor: string;
  sendButtonColor: string;
  sendButtonTextColor: string;

  // Additional content
  additionalContent?: ReactNode;
}

export function KeyboardAwareChat<T>({
  data,
  renderItem,
  keyExtractor,
  onContentSizeChange,
  flatListRef,
  ListFooterComponent,
  inputValue,
  onChangeText,
  onFocus,
  onBlur,
  onSend,
  inputRef,
  placeholder,
  sendDisabled,
  sendButtonContent,
  backgroundColor,
  inputBackgroundColor,
  textColor,
  borderColor,
  focusBorderColor,
  placeholderColor,
  sendButtonColor,
  sendButtonTextColor,
  additionalContent,
}: KeyboardAwareChatProps<T>) {
  const keyboardContext = useKeyboardVisibility();
  const isKeyboardVisible = keyboardContext?.isKeyboardVisible || false;
  const keyboardHeight = keyboardContext?.keyboardHeight || 0;
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Messages - takes full height */}
      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={onContentSizeChange}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        ListFooterComponent={ListFooterComponent}
      />

      {/* Input Container - Simple: absolute position based on keyboard height */}
      <View style={[
        styles.inputContainer,
        {
          backgroundColor,
          borderTopColor: borderColor,
          bottom: keyboardHeight,
          paddingBottom: isKeyboardVisible ? 12 : 50,
        }
      ]}>
          <TextInput
            ref={inputRef}
            style={[
              styles.textInput,
              {
                backgroundColor: inputBackgroundColor,
                color: textColor,
                borderColor: isFocused ? focusBorderColor : borderColor,
                borderWidth: isFocused ? 2 : 1,
              },
            ]}
            value={inputValue}
            onChangeText={onChangeText}
            onFocus={() => {
              setIsFocused(true);
              onFocus?.();
            }}
            onBlur={() => {
              setIsFocused(false);
              onBlur?.();
            }}
            placeholder={placeholder}
            placeholderTextColor={placeholderColor}
            multiline
            maxLength={1000}
            returnKeyType="done"
            blurOnSubmit={true}
            onSubmitEditing={() => Keyboard.dismiss()}
            enablesReturnKeyAutomatically={false}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: inputBackgroundColor,
                borderColor: sendButtonColor,
                borderWidth: 2,
              },
            ]}
            onPress={onSend}
            disabled={sendDisabled}
            activeOpacity={0.7}
          >
            {sendButtonContent || (
              <Text style={[styles.sendButtonText, { color: sendButtonTextColor }]}>
                Send
              </Text>
            )}
          </TouchableOpacity>
        </View>


      {additionalContent}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContainer: {
    paddingBottom: 16,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    // paddingBottom is applied dynamically based on keyboard state
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

