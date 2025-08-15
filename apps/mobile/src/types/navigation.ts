import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';

// Define the parameter list for each tab
export type TabParamList = {
  Home: undefined;
  Chat: undefined;
  Appointments: { appointmentId?: string };
  Payments: { paymentId?: string };
  Profile: undefined;
};

// Define the parameter list for stack navigation
export type RootStackParamList = {
  MainTabs: undefined;
  Login: undefined;
  Signup: undefined;
  Onboarding: undefined;
  AppointmentDetails: { appointmentId: string };
  PaymentDetails: { paymentId: string };
  ChatDetails: { chatId: string };
};

// Screen props for tab screens
export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

// Screen props for stack screens
export type StackScreenProps<T extends keyof RootStackParamList> = 
  NativeStackScreenProps<RootStackParamList, T>;

// Navigation prop types
export type TabNavigationProp = TabScreenProps<keyof TabParamList>['navigation'];
export type StackNavigationProp = StackScreenProps<keyof RootStackParamList>['navigation'];

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}