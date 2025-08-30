import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

interface AppointmentDetails {
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
}

interface MobileAppointmentCalendarProps {
  organizationId: string;
  businessName?: string;
  baseUrl?: string;
}

const MobileAppointmentCalendar: React.FC<MobileAppointmentCalendarProps> = ({
  organizationId,
  businessName = 'Our Business',
  baseUrl = 'https://chayo.ai',
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState<AppointmentDetails>({
    date: '',
    time: '',
    name: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  // Available time slots (9 AM to 5 PM)
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00'
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
    if (!isDateAvailable(date)) return;
    
    setSelectedDate(date);
    setShowTimeSlots(true);
    setAppointmentDetails(prev => ({
      ...prev,
      date: formatDateForAPI(date),
    }));
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setShowBookingForm(true);
    setAppointmentDetails(prev => ({
      ...prev,
      time: time,
    }));
  };

  const handleBookingSubmit = async () => {
    // Validate required fields
    if (!appointmentDetails.name || !appointmentDetails.email || !appointmentDetails.phone) {
      Alert.alert('Error', 'Please fill in all required fields (Name, Email, Phone)');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(appointmentDetails.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${baseUrl}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          clientName: appointmentDetails.name,
          clientEmail: appointmentDetails.email,
          clientPhone: appointmentDetails.phone,
          appointmentDate: appointmentDetails.date,
          appointmentTime: appointmentDetails.time,
          serviceType: 'General Consultation',
          notes: appointmentDetails.notes,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success!',
          `Your appointment has been booked for ${formatDate(selectedDate!)} at ${selectedTime}. We'll send you a confirmation email shortly.`,
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
                  name: '',
                  email: '',
                  phone: '',
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
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (showBookingForm) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.formContainer}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowBookingForm(false)}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Book Appointment</Text>
          </View>

          <View style={styles.selectedDateTimeCard}>
            <Text style={styles.selectedDateText}>
              📅 {selectedDate ? formatDate(selectedDate) : ''}
            </Text>
            <Text style={styles.selectedTimeText}>
              🕐 {selectedTime}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={appointmentDetails.name}
                onChangeText={(text) =>
                  setAppointmentDetails(prev => ({ ...prev, name: text }))
                }
                placeholder="Enter your full name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={appointmentDetails.email}
                onChangeText={(text) =>
                  setAppointmentDetails(prev => ({ ...prev, email: text }))
                }
                placeholder="Enter your email address"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone *</Text>
              <TextInput
                style={styles.input}
                value={appointmentDetails.phone}
                onChangeText={(text) =>
                  setAppointmentDetails(prev => ({ ...prev, phone: text }))
                }
                placeholder="Enter your phone number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={appointmentDetails.notes}
                onChangeText={(text) =>
                  setAppointmentDetails(prev => ({ ...prev, notes: text }))
                }
                placeholder="Any additional information or special requests..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.bookButton, isLoading && styles.bookButtonDisabled]}
              onPress={handleBookingSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.bookButtonText}>Book Appointment</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (showTimeSlots) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowTimeSlots(false)}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Time</Text>
        </View>

        <View style={styles.selectedDateCard}>
          <Text style={styles.selectedDateText}>
            📅 {selectedDate ? formatDate(selectedDate) : ''}
          </Text>
        </View>

        <ScrollView style={styles.timeSlotsContainer}>
          <Text style={styles.sectionTitle}>Available Times</Text>
          <View style={styles.timeSlotGrid}>
            {timeSlots.map((time) => (
              <TouchableOpacity
                key={time}
                style={styles.timeSlot}
                onPress={() => handleTimeSelect(time)}
              >
                <Text style={styles.timeSlotText}>{time}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Book with {businessName}</Text>
      </View>

      <View style={styles.calendarHeader}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('prev')}
        >
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>
        
        <Text style={styles.monthYear}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Text>
        
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('next')}
        >
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dayNamesRow}>
        {dayNames.map((day) => (
          <Text key={day} style={styles.dayName}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.calendar}>
        {getDaysInMonth(currentDate).map((date, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayCell,
              !date && styles.emptyDay,
              date && !isDateAvailable(date) && styles.unavailableDay,
              date && selectedDate && date.toDateString() === selectedDate.toDateString() && styles.selectedDay,
            ]}
            onPress={() => date && handleDateSelect(date)}
            disabled={!date || !isDateAvailable(date)}
          >
            {date && (
              <Text
                style={[
                  styles.dayText,
                  !isDateAvailable(date) && styles.unavailableDayText,
                  selectedDate && date.toDateString() === selectedDate.toDateString() && styles.selectedDayText,
                ]}
              >
                {date.getDate()}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1C1C1E',
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#0A84FF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
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
    color: '#0A84FF',
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
    backgroundColor: '#0A84FF',
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
    borderColor: '#0A84FF',
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
    color: '#0A84FF',
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
    backgroundColor: '#0A84FF',
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
