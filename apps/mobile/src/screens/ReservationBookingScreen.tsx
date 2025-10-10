import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useThemedStyles } from '../context/ThemeContext';
import { useAppConfig } from '../hooks/useAppConfig';
import Icon from 'react-native-vector-icons/Feather';
import AuthGate from '../components/AuthGate';

interface Product {
  id: string;
  name: string;
  description?: string;
  price?: number;
}

interface ReservationBookingScreenProps {
  route: {
    params: {
      product: Product;
      organizationId: string;
      selectedDate: string;
      selectedTime: string;
    };
  };
  navigation: any;
}

export const ReservationBookingScreen: React.FC<ReservationBookingScreenProps> = ({
  route,
  navigation,
}) => {
  const { product, organizationId, selectedDate, selectedTime } = route.params;
  const { theme, fontSizes, themedStyles } = useThemedStyles();
  const { config } = useAppConfig();
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleAuthenticatedBooking = async (user: any, customerId: string) => {
    if (!organizationId) {
      Alert.alert('Error', 'Organization not found');
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`${config?.apiBaseUrl}/api/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          productId: product.id,
          customerId,
          clientName: user.fullName || null,
          clientEmail: user.email,
          clientPhone: null,
          reservationDate: selectedDate.split('T')[0], // YYYY-MM-DD
          reservationTime: selectedTime,
          notes: notes.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create reservation');
      }

      const result = await response.json();

      Alert.alert(
        '¡Reservación Confirmada!',
        `Tu reservación para ${product.name} ha sido confirmada para el ${formatDate(selectedDate)} a las ${formatTime(selectedTime)}.`,
        [
          {
            text: 'Ver mis reservaciones',
            onPress: () => {
              navigation.navigate('Reservations');
            },
          },
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            },
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Error creating reservation:', error);
      Alert.alert(
        'Error',
        'No se pudo crear la reservación. Por favor intenta de nuevo.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, themedStyles.container]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Reservation Details */}
        <View style={styles.detailsContainer}>
          <Text style={[styles.sectionTitle, { color: theme.textColor, fontSize: fontSizes.lg }]}>
            Resumen de Reservación
          </Text>

          <View style={[styles.summaryCard, { backgroundColor: theme.surfaceColor, borderColor: theme.borderColor }]}>
            {/* Product */}
            <View style={styles.summaryRow}>
              <Icon name="package" size={20} color={theme.placeholderColor} />
              <Text style={[styles.summaryLabel, { color: theme.placeholderColor, fontSize: fontSizes.sm }]}>
                Servicio:
              </Text>
              <Text style={[styles.summaryValue, { color: theme.textColor, fontSize: fontSizes.base }]}>
                {product.name}
              </Text>
            </View>

            {/* Date */}
            <View style={styles.summaryRow}>
              <Icon name="calendar" size={20} color={theme.placeholderColor} />
              <Text style={[styles.summaryLabel, { color: theme.placeholderColor, fontSize: fontSizes.sm }]}>
                Fecha:
              </Text>
              <Text style={[styles.summaryValue, { color: theme.textColor, fontSize: fontSizes.base }]}>
                {formatDate(selectedDate)}
              </Text>
            </View>

            {/* Time */}
            <View style={styles.summaryRow}>
              <Icon name="clock" size={20} color={theme.placeholderColor} />
              <Text style={[styles.summaryLabel, { color: theme.placeholderColor, fontSize: fontSizes.sm }]}>
                Hora:
              </Text>
              <Text style={[styles.summaryValue, { color: theme.textColor, fontSize: fontSizes.base }]}>
                {formatTime(selectedTime)}
              </Text>
            </View>

            {/* Price */}
            {product.price && (
              <View style={styles.summaryRow}>
                <Icon name="dollar-sign" size={20} color={theme.placeholderColor} />
                <Text style={[styles.summaryLabel, { color: theme.placeholderColor, fontSize: fontSizes.sm }]}>
                  Precio:
                </Text>
                <Text style={[styles.summaryValue, { color: theme.primaryColor, fontSize: fontSizes.base, fontWeight: '700' }]}>
                  ${product.price.toFixed(2)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Notes Section */}
        <View style={styles.notesContainer}>
          <Text style={[styles.sectionTitle, { color: theme.textColor, fontSize: fontSizes.lg }]}>
            Notas Adicionales (Opcional)
          </Text>

          <TextInput
            style={[
              styles.notesInput,
              {
                backgroundColor: theme.surfaceColor,
                borderColor: theme.borderColor,
                color: theme.textColor,
                fontSize: fontSizes.base,
              },
            ]}
            placeholder="Información adicional o solicitudes especiales..."
            placeholderTextColor={theme.placeholderColor}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Confirm Button with AuthGate */}
      <View style={styles.footer}>
        <AuthGate
          organizationId={organizationId}
          onAuthenticated={handleAuthenticatedBooking}
          title="Inicia sesión para confirmar tu reservación"
          message={`Confirma tu reservación para ${product.name} el ${formatDate(selectedDate)} a las ${formatTime(selectedTime)}`}
        >
          <TouchableOpacity
            style={[
              styles.confirmButton,
              {
                backgroundColor: theme.primaryColor,
                opacity: isLoading ? 0.6 : 1,
              },
            ]}
            disabled={isLoading}
          >
            <Icon name="check-circle" size={20} color="#FFFFFF" />
            <Text style={[styles.confirmButtonText, { fontSize: fontSizes.base }]}>
              {isLoading ? 'Confirmando...' : 'Confirmar Reservación'}
            </Text>
          </TouchableOpacity>
        </AuthGate>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  detailsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 16,
  },
  summaryCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  summaryLabel: {
    width: 60,
  },
  summaryValue: {
    flex: 1,
    fontWeight: '500',
  },
  notesContainer: {
    padding: 20,
    paddingTop: 0,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
  },
  footer: {
    padding: 20,
    paddingBottom: 34, // Safe area
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
