import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

interface WelcomeModalProps {
  visible: boolean;
  onTryDemo: () => void;
  onEnterCode: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({
  visible,
  onTryDemo,
  onEnterCode,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to Chayo</Text>
            <Text style={styles.subtitle}>
              Discover how Chayo can transform your business
            </Text>
          </View>

          {/* Demo Option */}
          <TouchableOpacity
            style={[styles.optionButton, styles.demoButton]}
            onPress={onTryDemo}
            activeOpacity={0.8}
          >
            <View style={styles.optionContent}>
              <Text style={styles.optionIcon}>🎯</Text>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Try Demo</Text>
                <Text style={styles.optionDescription}>
                  See Chayo in action with sample business data
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Enter Code Option */}
          <TouchableOpacity
            style={[styles.optionButton, styles.codeButton]}
            onPress={onEnterCode}
            activeOpacity={0.8}
          >
            <View style={styles.optionContent}>
              <Text style={styles.optionIcon}>📱</Text>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Enter Business Code</Text>
                <Text style={styles.optionDescription}>
                  Connect to your business with a 6-digit code
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Footer */}
          <Text style={styles.footer}>
            You can always switch between demo and your business later
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: width * 0.9,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  optionButton: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
  },
  demoButton: {
    backgroundColor: '#f8f4ff',
    borderColor: '#8b5cf6',
  },
  codeButton: {
    backgroundColor: '#f0f9ff',
    borderColor: '#0ea5e9',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  footer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
  },
});

export default WelcomeModal;
