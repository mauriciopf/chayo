import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useThemedStyles } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/Feather';

interface Product {
  id: string;
  name: string;
  description?: string;
  price?: number;
}

interface ReservationCalendarScreenProps {
  route: {
    params: {
      product: Product;
      organizationId: string;
    };
  };
  navigation: any;
}

// Simple custom calendar component without external dependencies
const SimpleCalendar: React.FC<{
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
  theme: any;
  fontSizes: any;
}> = ({ onDateSelect, selectedDate, theme, fontSizes }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const renderDays = () => {
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);
      const isPast = date < today;
      const isSelected = selectedDate?.toDateString() === date.toDateString();
      const isToday = date.toDateString() === today.toDateString();

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayCell,
            styles.dayButton,
            isSelected && { backgroundColor: theme.primaryColor },
            isPast && styles.pastDay,
          ]}
          onPress={() => !isPast && onDateSelect(date)}
          disabled={isPast}
        >
          <Text
            style={[
              styles.dayText,
              { color: theme.textColor, fontSize: fontSizes.sm },
              isSelected && styles.selectedDayText,
              isPast && styles.pastDayText,
              isToday && !isSelected && [{ color: theme.primaryColor }, styles.todayText],
            ]}
          >
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  return (
    <View style={[styles.calendar, { backgroundColor: theme.surfaceColor }]}>
      {/* Month Header */}
      <View style={styles.monthHeader}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.monthButton}>
          <Icon name="chevron-left" size={24} color={theme.textColor} />
        </TouchableOpacity>

        <Text style={[styles.monthText, { color: theme.textColor, fontSize: fontSizes.lg }]}>
          {monthNames[month]} {year}
        </Text>

        <TouchableOpacity onPress={goToNextMonth} style={styles.monthButton}>
          <Icon name="chevron-right" size={24} color={theme.textColor} />
        </TouchableOpacity>
      </View>

      {/* Day Names */}
      <View style={styles.dayNamesRow}>
        {dayNames.map((name) => (
          <View key={name} style={styles.dayNameCell}>
            <Text style={[styles.dayNameText, { color: theme.placeholderColor, fontSize: fontSizes.xs }]}>
              {name}
            </Text>
          </View>
        ))}
      </View>

      {/* Days Grid */}
      <View style={styles.daysGrid}>
        {renderDays()}
      </View>
    </View>
  );
};

export const ReservationCalendarScreen: React.FC<ReservationCalendarScreenProps> = ({
  route,
  navigation,
}) => {
  const { product, organizationId } = route.params;
  const { theme, fontSizes } = useThemedStyles();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleDateSelect = (date: Date) => {
    console.log('📅 Date selected:', date.toISOString());
    setSelectedDate(date);

    // Navigate immediately (no setTimeout to avoid background app issues)
    console.log('🗓️ Navigating to time selection...');
    try {
      navigation.navigate('ReservationTimeSelection', {
        product,
        organizationId,
        selectedDate: date.toISOString(),
      });
      console.log('✅ Navigation called successfully');
    } catch (error) {
      console.error('❌ Navigation error:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Product Info Header */}
        <View
          style={[
            styles.productHeader,
            { backgroundColor: theme.surfaceColor, borderColor: theme.borderColor },
          ]}
        >
          <Icon name="package" size={24} color={theme.primaryColor} />
          <View style={styles.productInfo}>
            <Text style={[styles.productName, { color: theme.textColor, fontSize: fontSizes.lg }]}>
              {product.name}
            </Text>
            {product.price && (
              <Text style={[styles.productPrice, { color: theme.primaryColor, fontSize: fontSizes.base }]}>
                ${product.price.toFixed(2)}
              </Text>
            )}
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Icon name="calendar" size={20} color={theme.placeholderColor} />
          <Text style={[styles.instructions, { color: theme.placeholderColor, fontSize: fontSizes.sm }]}>
            Selecciona la fecha para tu reservación
          </Text>
        </View>

        {/* Calendar */}
        <SimpleCalendar
          onDateSelect={handleDateSelect}
          selectedDate={selectedDate}
          theme={theme}
          fontSizes={fontSizes}
        />

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
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  productPrice: {
    fontWeight: '700',
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
  calendar: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthButton: {
    padding: 8,
  },
  monthText: {
    fontWeight: '700',
  },
  dayNamesRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayNameCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayNameText: {
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%', // 7 days in a week
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButton: {
    borderRadius: 8,
  },
  dayText: {
    fontWeight: '500',
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pastDay: {
    opacity: 0.3,
  },
  pastDayText: {
    opacity: 0.5,
  },
  todayText: {
    fontWeight: '700',
  },
});
