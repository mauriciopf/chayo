import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useThemedStyles } from '../context/ThemeContext';


export const AppointmentTimeSelectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { selectedDate: selectedDateString, organizationId } = route.params as { selectedDate: string; organizationId: string };
  const selectedDate = new Date(selectedDateString); // Parse string back to Date
  const { theme, fontSizes, themedStyles } = useThemedStyles();

  // Available time slots (9 AM to 5 PM)
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00',
  ];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleTimeSelect = (time: string) => {
    // Navigate immediately without updating state to avoid re-render issues
    (navigation as any).navigate('AppointmentBooking', {
      selectedDate: selectedDate.toISOString(),
      selectedTime: time,
      organizationId,
    });
  };

  return (
    <SafeAreaView style={[styles.container, themedStyles.container]}>
      {/* Selected Date Display */}
      <View style={styles.dateContainer}>
        <Text style={[styles.dateText, { color: theme.textColor, fontSize: fontSizes.lg }]}>
          {formatDate(selectedDate)}
        </Text>
      </View>

      {/* Available Times */}
      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: theme.textColor, fontSize: fontSizes.lg }]}>
          Horarios Disponibles
        </Text>

        <ScrollView style={styles.timeSlotsContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.timeSlotsGrid}>
            {timeSlots.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeSlot,
                  {
                    backgroundColor: theme.surfaceColor,
                    borderColor: theme.borderColor,
                  },
                ]}
                onPress={() => handleTimeSelect(time)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.timeSlotText,
                  {
                    color: theme.textColor,
                    fontSize: fontSizes.base,
                  },
                ]}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  dateContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F4E4BC',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F4E4BC',
    marginBottom: 20,
  },
  timeSlotsContainer: {
    flex: 1,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  timeSlot: {
    width: '30%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  timeSlotText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F4E4BC',
  },
});
