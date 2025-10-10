import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useThemedStyles } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/Feather';

interface Product {
  id: string;
  name: string;
  description?: string;
  price?: number;
}

interface ReservationTimeSelectionScreenProps {
  route: {
    params: {
      product: Product;
      organizationId: string;
      selectedDate: string;
    };
  };
  navigation: any;
}

// Generate time slots (9 AM - 5 PM, 30-minute intervals)
const generateTimeSlots = () => {
  const slots: string[] = [];
  for (let hour = 9; hour <= 17; hour++) {
    if (hour === 17) {
      slots.push(`${hour}:00`);
    } else {
      slots.push(`${hour}:00`);
      slots.push(`${hour}:30`);
    }
  }
  return slots;
};

export const ReservationTimeSelectionScreen: React.FC<ReservationTimeSelectionScreenProps> = ({
  route,
  navigation,
}) => {
  const { product, organizationId, selectedDate } = route.params;
  const { theme, fontSizes } = useThemedStyles();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const timeSlots = generateTimeSlots();

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleTimeSelect = (time: string) => {
    console.log('⏰ Time selected:', time);
    setSelectedTime(time);

    // Navigate immediately (no setTimeout to avoid background app issues)
    console.log('🗓️ Navigating to booking confirmation...');
    try {
      navigation.navigate('ReservationBooking', {
        product,
        organizationId,
        selectedDate,
        selectedTime: time,
      });
      console.log('✅ Navigation called successfully');
    } catch (error) {
      console.error('❌ Navigation error:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Date Header */}
        <View
          style={[
            styles.dateHeader,
            { backgroundColor: theme.surfaceColor, borderColor: theme.borderColor },
          ]}
        >
          <Icon name="calendar" size={20} color={theme.primaryColor} />
          <Text style={[styles.dateText, { color: theme.textColor, fontSize: fontSizes.base }]}>
            {new Date(selectedDate).toLocaleDateString('es', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Icon name="clock" size={20} color={theme.placeholderColor} />
          <Text style={[styles.instructions, { color: theme.placeholderColor, fontSize: fontSizes.sm }]}>
            Selecciona un horario disponible
          </Text>
        </View>

        {/* Product Info */}
        <View
          style={[
            styles.productInfo,
            { backgroundColor: theme.surfaceColor, borderColor: theme.borderColor },
          ]}
        >
          <Icon name="package" size={16} color={theme.placeholderColor} />
          <Text style={[styles.productName, { color: theme.textColor, fontSize: fontSizes.sm }]}>
            {product.name}
          </Text>
        </View>

        {/* Time Slots Grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primaryColor} />
          </View>
        ) : (
          <View style={styles.timeSlotsGrid}>
            {timeSlots.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeSlot,
                  {
                    backgroundColor:
                      selectedTime === time
                        ? theme.primaryColor
                        : theme.surfaceColor,
                    borderColor:
                      selectedTime === time
                        ? theme.primaryColor
                        : theme.borderColor,
                  },
                ]}
                onPress={() => handleTimeSelect(time)}
                activeOpacity={0.7}
              >
                <Icon
                  name="clock"
                  size={16}
                  color={
                    selectedTime === time ? '#FFFFFF' : theme.placeholderColor
                  }
                />
                <Text
                  style={[
                    styles.timeText,
                    {
                      color:
                        selectedTime === time ? '#FFFFFF' : theme.textColor,
                      fontSize: fontSizes.sm,
                      fontWeight: selectedTime === time ? '600' : '500',
                    },
                  ]}
                >
                  {formatTime(time)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  dateText: {
    flex: 1,
    fontWeight: '500',
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  instructions: {
    flex: 1,
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  productName: {
    flex: 1,
    fontWeight: '500',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 2,
    gap: 6,
    minWidth: '30%',
    flex: 1,
    maxWidth: '48%',
  },
  timeText: {
    fontWeight: '500',
  },
});

