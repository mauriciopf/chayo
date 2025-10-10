import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useThemedStyles } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useAppConfig } from '../hooks/useAppConfig';
import Icon from 'react-native-vector-icons/Feather';

interface Product {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  price?: number;
}

interface Reservation {
  id: string;
  product_id: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  reservation_date: string;
  reservation_time: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  created_at: string;
  products_list_tool?: Product;
}

interface ReservationsScreenProps {
  navigation: any;
}

export const ReservationsScreen: React.FC<ReservationsScreenProps> = ({ navigation }) => {
  const { theme, fontSizes, themedStyles } = useThemedStyles();
  const { user } = useAuth();
  const { config } = useAppConfig();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReservations = useCallback(async () => {
    if (!config?.organizationId || !user?.email) {
      setLoading(false);
      return;
    }

    try {
      // Fetch user's reservations
      const response = await fetch(
        `${config.apiBaseUrl}/api/reservations?email=${encodeURIComponent(user.email)}&organizationId=${config.organizationId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch reservations');
      }

      const data = await response.json();
      setReservations(data.reservations || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      Alert.alert('Error', 'No se pudieron cargar las reservaciones');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [config, user]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReservations();
  };

  const getStatusInfo = (status: Reservation['status']) => {
    switch (status) {
      case 'pending':
        return { label: 'Pendiente', color: '#FFA500', icon: 'clock' };
      case 'confirmed':
        return { label: 'Confirmada', color: '#4CAF50', icon: 'check-circle' };
      case 'cancelled':
        return { label: 'Cancelada', color: '#F44336', icon: 'x-circle' };
      case 'completed':
        return { label: 'Completada', color: '#2196F3', icon: 'check' };
      case 'no_show':
        return { label: 'No se presentó', color: '#9E9E9E', icon: 'alert-circle' };
      default:
        return { label: status, color: theme.placeholderColor, icon: 'help-circle' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    // timeString is in format "HH:MM:SS"
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  const handleCancelReservation = (reservationId: string) => {
    Alert.alert(
      'Cancelar Reservación',
      '¿Estás seguro de que deseas cancelar esta reservación?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(
                `${config?.apiBaseUrl}/api/reservations`,
                {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    reservationId, 
                    status: 'cancelled' 
                  }),
                }
              );

              if (!response.ok) {
                throw new Error('Failed to cancel reservation');
              }

              Alert.alert('Éxito', 'Reservación cancelada');
              fetchReservations();
            } catch (error) {
              console.error('Error canceling reservation:', error);
              Alert.alert('Error', 'No se pudo cancelar la reservación');
            }
          },
        },
      ]
    );
  };

  const renderReservation = ({ item }: { item: Reservation }) => {
    const statusInfo = getStatusInfo(item.status);
    const product = item.products_list_tool;

    return (
      <View style={[styles.reservationCard, { backgroundColor: theme.surfaceColor, borderColor: theme.borderColor }]}>
        {/* Product Name */}
        <View style={styles.productHeader}>
          <Icon name="shopping-bag" size={20} color={theme.primaryColor} />
          <Text style={[styles.productName, { color: theme.textColor, fontSize: fontSizes.lg }]} numberOfLines={1}>
            {product?.name || 'Producto'}
          </Text>
        </View>

        {/* Date & Time */}
        <View style={styles.dateTimeRow}>
          <View style={styles.dateTimeItem}>
            <Icon name="calendar" size={16} color={theme.placeholderColor} />
            <Text style={[styles.dateTimeText, { color: theme.textColor, fontSize: fontSizes.sm }]}>
              {formatDate(item.reservation_date)}
            </Text>
          </View>
          <View style={styles.dateTimeItem}>
            <Icon name="clock" size={16} color={theme.placeholderColor} />
            <Text style={[styles.dateTimeText, { color: theme.textColor, fontSize: fontSizes.sm }]}>
              {formatTime(item.reservation_time)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {item.notes && (
          <View style={styles.notesContainer}>
            <Text style={[styles.notesLabel, { color: theme.placeholderColor, fontSize: fontSizes.xs }]}>
              Notas:
            </Text>
            <Text style={[styles.notesText, { color: theme.textColor, fontSize: fontSizes.sm }]}>
              {item.notes}
            </Text>
          </View>
        )}

        {/* Status & Actions */}
        <View style={styles.footer}>
          <View style={[styles.statusBadge, { backgroundColor: `${statusInfo.color}20` }]}>
            <Icon name={statusInfo.icon as any} size={14} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color, fontSize: fontSizes.xs }]}>
              {statusInfo.label}
            </Text>
          </View>

          {/* Cancel Button (only for pending/confirmed) */}
          {(item.status === 'pending' || item.status === 'confirmed') && (
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: theme.borderColor }]}
              onPress={() => handleCancelReservation(item.id)}
            >
              <Text style={[styles.cancelButtonText, { color: theme.placeholderColor, fontSize: fontSizes.xs }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="calendar" size={64} color={theme.placeholderColor} />
      <Text style={[styles.emptyStateTitle, { color: theme.textColor, fontSize: fontSizes.xl }]}>
        No tienes reservaciones
      </Text>
      <Text style={[styles.emptyStateText, { color: theme.placeholderColor, fontSize: fontSizes.base }]}>
        Explora el catálogo de productos y haz tu primera reservación
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, themedStyles.container]}>
      <FlatList
        data={reservations}
        renderItem={renderReservation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primaryColor}
          />
        }
        ListEmptyComponent={!loading ? renderEmptyState : null}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  reservationCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  productName: {
    fontWeight: '700',
    flex: 1,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  dateTimeText: {
    flex: 1,
  },
  notesContainer: {
    marginBottom: 12,
  },
  notesLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  notesText: {
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    textAlign: 'center',
    lineHeight: 24,
  },
});

