import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useThemedStyles } from '../context/ThemeContext';
import { useScreenNavigation } from '../context/NavigationContext';
import AuthGate from './AuthGate';
import { useAppConfig } from '../hooks/useAppConfig';
import { createCustomerInteraction } from '../services/authService';
import LoadingScreen from './LoadingScreen';

const { width } = Dimensions.get('window');

interface AppointmentDetails {
  date: string;
  time: string;
  notes: string;
}

interface MobileAppointmentCalendarProps {
  organizationId: string;
  businessName?: string;
  baseUrl?: string;
  navigation?: any;
}

const MobileAppointmentCalendar: React.FC<MobileAppointmentCalendarProps> = ({
  organizationId,
  baseUrl = 'https://chayo.ai',
  navigation,
}) => {
  const { theme, themedStyles } = useThemedStyles();
  const { config } = useAppConfig();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState<AppointmentDetails>({
    date: '',
    time: '',
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const { setScreenHeader, setRootNavigation } = useScreenNavigation();

  // Set up navigation headers based on current state
  useEffect(() => {
    if (showBookingForm) {
      setScreenHeader('Book Appointment', {
        onBackPress: () => setShowBookingForm(false),
      });
    } else if (showTimeSlots) {
      setScreenHeader('Select Time', {
        onBackPress: () => setShowTimeSlots(false),
      });
    } else {
      // At root level - let business header show
      setRootNavigation();
    }
  }, [showBookingForm, showTimeSlots, setScreenHeader, setRootNavigation]);

  // Available time slots (9 AM to 5 PM)
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00',
  ];

  // Get days in current month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

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

  const isDateAvailable = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  const handleDateSelect = (date: Date) => {
    if (!isDateAvailable(date)) {
      return;
    }

    // Navigate to time selection screen instead of showing internal state
    if (navigation) {
      navigation.navigate('AppointmentTimeSelection', {
        selectedDate: date.toISOString(), // Convert Date to string for navigation
        organizationId,
      });
    } else {
      // Fallback to internal state if navigation not available
      setSelectedDate(date);
      setShowTimeSlots(true);
      setAppointmentDetails(prev => ({
        ...prev,
        date: formatDateForAPI(date),
      }));
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setShowBookingForm(true);
    setAppointmentDetails(prev => ({
      ...prev,
      time: time,
    }));
  };

  const handleAuthenticatedBooking = async (user: any, customerId: string) => {
    setIsLoading(true);

    try {
      const appointmentData = {
        organizationId: config?.organizationId || organizationId,
        customerId,
        clientName: user.fullName,
        clientEmail: user.email,
        appointmentDate: selectedDate ? formatDateForAPI(selectedDate) : '',
        appointmentTime: selectedTime,
        serviceType: 'General Consultation',
        notes: appointmentDetails.notes,
      };

      // Track customer interaction
      await createCustomerInteraction(
        customerId,
        config?.organizationId || organizationId,
        'appointments',
        {
          date: appointmentData.appointmentDate,
          time: appointmentData.appointmentTime,
          service: appointmentData.serviceType,
          notes: appointmentData.notes,
        }
      );

      // Submit appointment
      const response = await fetch(`${baseUrl}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success!',
          `Your appointment has been booked for ${formatDate(selectedDate!)} at ${selectedTime}.\n\nConfirmation will be sent to ${user.email}`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form
                setSelectedDate(null);
                setSelectedTime(null);
                setShowTimeSlots(false);
                setShowBookingForm(false);
                setAppointmentDetails({
                  date: '',
                  time: '',
                  notes: '',
                });
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to book appointment. Please try again.');
      }
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (showBookingForm) {
    return (
      <SafeAreaView style={[styles.container, themedStyles.container]}>
        <ScrollView style={[styles.formContainer, { backgroundColor: theme.backgroundColor }]}>
          {/* Header is now managed by NavigationContext */}

          <View style={[styles.selectedDateTimeCard, { backgroundColor: theme.primaryColor, borderColor: theme.primaryColor }]}>
            <Text style={[styles.selectedDateText, { color: theme.backgroundColor }]}>
              📅 {selectedDate ? formatDate(selectedDate) : ''}
            </Text>
            <Text style={[styles.selectedTimeText, { color: theme.backgroundColor }]}>
              🕐 {selectedTime}
            </Text>
          </View>

          <View style={[styles.form, { backgroundColor: theme.backgroundColor }]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, themedStyles.primaryText]}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: theme.surfaceColor, color: theme.textColor, borderColor: theme.borderColor }]}
                value={appointmentDetails.notes}
                onChangeText={(text) =>
                  setAppointmentDetails(prev => ({ ...prev, notes: text }))
                }
                placeholder="Any additional information or special requests..."
                placeholderTextColor={theme.placeholderColor}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <AuthGate
              tool="appointments"
              organizationId={config?.organizationId || organizationId}
              onAuthenticated={handleAuthenticatedBooking}
              title="Sign in to book your appointment"
              message={`Confirm your appointment for ${formatDate(selectedDate!)} at ${selectedTime}`}
            >
              <TouchableOpacity
                style={[styles.bookButton, { backgroundColor: theme.primaryColor }, isLoading && styles.bookButtonDisabled]}
                disabled={isLoading}
              >
                {isLoading ? (
                  <LoadingScreen />
                ) : (
                  <Text style={[styles.bookButtonText, { color: theme.backgroundColor }]}>Book Appointment</Text>
                )}
              </TouchableOpacity>
            </AuthGate>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (showTimeSlots) {
    return (
      <SafeAreaView style={[styles.container, themedStyles.container]}>
        {/* Header is now managed by NavigationContext */}

        <View style={[styles.selectedDateCard, { backgroundColor: theme.surfaceColor, borderColor: theme.borderColor }]}>
          <Text style={[styles.selectedDateText, { color: theme.textColor }]}>
            📅 {selectedDate ? formatDate(selectedDate) : ''}
          </Text>
        </View>

        <ScrollView style={[styles.timeSlotsContainer, { backgroundColor: theme.backgroundColor }]}>
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>Available Times</Text>
          <View style={styles.timeSlotGrid}>
            {timeSlots.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeSlot,
                  {
                    backgroundColor: selectedTime === time ? theme.primaryColor : theme.surfaceColor,
                    borderColor: selectedTime === time ? theme.primaryColor : theme.borderColor,
                  },
                ]}
                onPress={() => handleTimeSelect(time)}
              >
                <Text style={[
                  styles.timeSlotText,
                  { color: selectedTime === time ? theme.backgroundColor : theme.textColor },
                ]}>{time}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, themedStyles.container]}>
      {/* Header is now managed by NavigationContext - shows business name */}

      <View style={[styles.calendarHeader, { backgroundColor: theme.surfaceColor }]}>
        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: theme.backgroundColor }]}
          onPress={() => navigateMonth('prev')}
        >
          <Text style={[styles.navButtonText, { color: theme.primaryColor }]}>‹</Text>
        </TouchableOpacity>

        <Text style={[styles.monthYear, themedStyles.primaryText]}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Text>

        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: theme.backgroundColor }]}
          onPress={() => navigateMonth('next')}
        >
          <Text style={[styles.navButtonText, { color: theme.primaryColor }]}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.dayNamesRow, { backgroundColor: theme.surfaceColor }]}>
        {dayNames.map((day) => (
          <Text key={day} style={[styles.dayName, themedStyles.secondaryText]}>
            {day}
          </Text>
        ))}
      </View>

      <View style={[styles.calendar, { backgroundColor: theme.backgroundColor }]}>
        {getDaysInMonth(currentDate).map((date, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayCell,
              !date && styles.emptyDay,
              date && !isDateAvailable(date) && styles.unavailableDay,
              date && selectedDate && date.toDateString() === selectedDate.toDateString() &&
                { ...styles.selectedDay, backgroundColor: theme.primaryColor },
            ]}
            onPress={() => date && handleDateSelect(date)}
            disabled={!date || !isDateAvailable(date)}
          >
            {date && (
              <Text
                style={[
                  { ...styles.dayText, color: theme.textColor },
                  !isDateAvailable(date) && { color: theme.placeholderColor },
                  selectedDate && date.toDateString() === selectedDate.toDateString() &&
                    { ...styles.selectedDayText, color: theme.backgroundColor },
                ]}
              >
                {date.getDate()}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.footer, { backgroundColor: theme.surfaceColor }]}>
        <Text style={[styles.footerText, themedStyles.secondaryText]}>
          Select a date to view available appointment times
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#2C2C2E',
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3A3A3C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 24,
    color: '#2F5D62',
    fontWeight: '600',
  },
  monthYear: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dayNamesRow: {
    flexDirection: 'row',
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  dayName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  dayCell: {
    width: (width - 40) / 7,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyDay: {
    // Empty cells for padding
  },
  dayText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  unavailableDay: {
    opacity: 0.3,
  },
  unavailableDayText: {
    color: '#8E8E93',
  },
  selectedDay: {
    backgroundColor: '#2F5D62',
    borderRadius: 22,
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: '600',
  },
  selectedDateCard: {
    backgroundColor: '#2C2C2E',
    marginHorizontal: 20,
    marginVertical: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  selectedDateTimeCard: {
    backgroundColor: '#2C2C2E',
    marginHorizontal: 20,
    marginVertical: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2F5D62',
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  selectedTimeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2F5D62',
    textAlign: 'center',
    marginTop: 4,
  },
  timeSlotsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  timeSlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeSlot: {
    width: (width - 60) / 3,
    backgroundColor: '#2C2C2E',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3A3A3C',
    marginBottom: 12,
    alignItems: 'center',
  },
  timeSlotText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  formContainer: {
    flex: 1,
  },
  form: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#3A3A3C',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  bookButton: {
    backgroundColor: '#2F5D62',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  bookButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  footer: {
    padding: 20,
    backgroundColor: '#2C2C2E',
  },
  footerText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});

export default MobileAppointmentCalendar;
