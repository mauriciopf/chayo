import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// Product interface for navigation
interface Product {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  price?: number;
  payment_transaction_id?: string;
  created_at: string;
  updated_at: string;
}

// Define the parameter list for stack navigation
export type RootStackParamList = {
  Marketplace: undefined;
  BusinessInitialView: undefined;
  BusinessDetail: {
    organizationSlug: string;
    businessName: string;
  };
  Login: undefined;
  ProductDetail: { product: Product };
  Signup: undefined;
  Onboarding: undefined;
  AppointmentDetails: { appointmentId: string };
  AppointmentTimeSelection: {
    selectedDate: string; // Date as ISO string for navigation
    organizationId: string;
  };
  AppointmentBooking: {
    selectedDate: string; // Date as ISO string for navigation
    selectedTime: string;
    organizationId: string;
  };
  DocumentDetail: {
    document: any;
    totalDocuments: number;
  };
  FormDetail: {
    formId: string;
  };
  PaymentDetails: { paymentId: string };
  ChatDetails: { chatId: string };
};

// Screen props for stack screens
export type StackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

// Navigation prop types
export type StackNavigationProp = StackScreenProps<keyof RootStackParamList>['navigation'];

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
