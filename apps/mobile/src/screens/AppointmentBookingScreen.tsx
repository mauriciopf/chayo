import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useThemedStyles } from '../context/ThemeContext';
import { useNavigationHeader } from '../context/NavigationContext';
import { createCustomerInteraction } from '../services/authService';
import AuthGate from '../components/AuthGate';

export const AppointmentBookingScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { selectedDate: selectedDateString, selectedTime, organizationId } = route.params as { 
    selectedDate: string; 
    selectedTime: string; 
    organizationId: string; 
  };
  const selectedDate = new Date(selectedDateString); // Parse string back to Date
  const { theme, themedStyles } = useThemedStyles();
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Memoize the back press handler to prevent infinite re-renders
  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Use auto-cleanup navigation header (same pattern as other detail screens)
  useNavigationHeader('Book Appointment', {
    onBackPress: handleBackPress,
    autoCleanup: true,
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateForAPI = (date: Date) => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  const handleAuthenticatedBooking = async (user: any, customerId: string) => {
    if (!organizationId) {
      Alert.alert('Error', 'Organization not found');
      return;
    }

    try {
      setIsLoading(true);

      const appointmentData = {
        customer_id: customerId,
        organization_id: organizationId,
        appointment_date: formatDateForAPI(selectedDate),
        appointment_time: selectedTime,
        notes: notes.trim(),
        status: 'scheduled',
      };

      console.log('Creating appointment:', appointmentData);

      // Create customer interaction record
      await createCustomerInteraction(
        customerId,
        organizationId,
        'appointment_booking',
        `Appointment booked for ${formatDate(selectedDate)} at ${selectedTime}`,
        { appointmentData }
      );

      Alert.alert(
        'Appointment Booked!',
        `Your appointment has been scheduled for ${formatDate(selectedDate)} at ${selectedTime}.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to Hub
              navigation.navigate('HubMain');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error booking appointment:', error);
      Alert.alert(
        'Booking Failed',
        'There was an error booking your appointment. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookAppointment = () => {
    // This will trigger the AuthGate modal
    setIsLoading(true);
  };

  return (
    <SafeAreaView style={[styles.container, themedStyles.container]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Appointment Details */}
        <View style={styles.detailsContainer}>
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
            Appointment Details
          </Text>
          
          <View style={[styles.detailCard, { backgroundColor: theme.surfaceColor }]}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.placeholderColor }]}>
                Date
              </Text>
              <Text style={[styles.detailValue, { color: theme.textColor }]}>
                {formatDate(selectedDate)}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.placeholderColor }]}>
                Time
              </Text>
              <Text style={[styles.detailValue, { color: theme.textColor }]}>
                {selectedTime}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes Section */}
        <View style={styles.notesContainer}>
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
            Additional Notes (Optional)
          </Text>
          
          <TextInput
            style={[
              styles.notesInput,
              {
                backgroundColor: theme.surfaceColor,
                borderColor: theme.borderColor,
                color: theme.textColor,
              }
            ]}
            placeholder="Any special requests or notes..."
            placeholderTextColor={theme.placeholderColor}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Book Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.bookButton,
            { 
              backgroundColor: theme.primaryColor,
              opacity: isLoading ? 0.6 : 1,
            }
          ]}
          onPress={handleBookAppointment}
          disabled={isLoading}
        >
          <Text style={styles.bookButtonText}>
            {isLoading ? 'Booking...' : 'Book Appointment'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* AuthGate Modal - Only show when booking is triggered */}
      {isLoading && (
        <AuthGate onAuthenticated={handleAuthenticatedBooking}>
          <View />
        </AuthGate>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  content: {
    flex: 1,
  },
  detailsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F4E4BC',
    marginBottom: 16,
  },
  detailCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 16,
    color: 'rgba(244, 228, 188, 0.8)',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F4E4BC',
  },
  notesContainer: {
    padding: 20,
    paddingTop: 0,
  },
  notesInput: {
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: 'rgba(244, 228, 188, 0.2)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#F4E4BC',
    minHeight: 100,
  },
  footer: {
    padding: 20,
    paddingBottom: 34, // Safe area
  },
  bookButton: {
    backgroundColor: '#D4A574',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
