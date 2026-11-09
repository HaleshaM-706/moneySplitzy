import React, { useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import notifee, { AndroidImportance, AuthorizationStatus, EventType } from '@notifee/react-native';
import {
  getInitialNotification,
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
} from '@react-native-firebase/messaging';
import { getApp } from '@react-native-firebase/app';
import { createNativeStackNavigator, type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Activity as ActivityIcon, Bell, UserRound, Users, Wallet } from 'lucide-react-native';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import SplashScreen from '../../features/auth/screens/SplashScreen';
import LoginScreen from '../../features/auth/screens/LoginScreen';
import RegisterScreen from '../../features/auth/screens/RegisterScreen';
import VerifyEmailScreen from '../../features/auth/screens/VerifyEmailScreen';
import DashboardScreen from '../../features/dashboard/DashboardScreen';
import GroupsScreen from '../../features/groups/GroupsScreen';
import CreateGroupScreen from '../../features/groups/CreateGroupScreen';
import GroupDetailsScreen from '../../features/groups/GroupDetailsScreen';
import AddExpenseScreen from '../../features/groups/AddExpenseScreen';
import InviteMemberScreen from '../../features/groups/InviteMemberScreen';
import AcceptInvitationScreen from '../../features/groups/AcceptInvitationScreen';
import ActivityScreen from '../../features/activity/ActivityScreen';
import NotificationsScreen from '../../features/notifications/NotificationsScreen';
import ProfileScreen from '../../features/profile/ProfileScreen';
import { useAppDispatch, useAppSelector } from '../../shared/hooks/useAppHooks';
import {
  useGetNotificationsQuery,
  useRegisterPushDeviceMutation,
  apiSlice,
} from '../../services/api/apiSlice';

export type MainTabParamList = {
  Balances: undefined;
  Groups: undefined;
  Activity: undefined;
  Profile: undefined;
  Notifications: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  VerifyEmail: { email: string; emailSent?: boolean };
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  CreateGroup: undefined;
  GroupDetails: { groupId: string };
  AddExpense: { groupId: string; expenseId?: string };
  InviteMember: { groupId: string };
  AcceptInvitation: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

type TabIconProps = { color: string; size: number };

function BalancesTabIcon({ color, size }: TabIconProps) {
  return <Wallet color={color} size={size} strokeWidth={2.2} />;
}

function GroupsTabIcon({ color, size }: TabIconProps) {
  return <Users color={color} size={size} strokeWidth={2.1} />;
}

function ActivityTabIcon({ color, size }: TabIconProps) {
  return <ActivityIcon color={color} size={size} strokeWidth={2.1} />;
}

function ProfileTabIcon({ color, size }: TabIconProps) {
  return <UserRound color={color} size={size} strokeWidth={2.1} />;
}

function NotificationsTabIcon({ color, size }: TabIconProps) {
  return <Bell color={color} size={size} strokeWidth={2.1} />;
}

function MainTabs() {
  const { token } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data: notifications = [] } = useGetNotificationsQuery(
    { page: 1, pageSize: 100 },
    { skip: !token },
  );
  const [registerPushDevice] = useRegisterPushDeviceMutation();
  const unreadCount = useMemo(
    () => notifications.filter(notification => !notification.read).length,
    [notifications],
  );

  useEffect(() => {
    if (!token) return undefined;

    let active = true;
    const platform = Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : null;
    if (!platform) return undefined;
    let unsubscribeTokenRefresh: (() => void) | undefined;
    let unsubscribeForegroundMessage: (() => void) | undefined;
    let unsubscribeNotificationOpened: (() => void) | undefined;
    const openInbox = () => {
      dispatch(apiSlice.util.invalidateTags(['Notifications']));
      navigation.navigate('Main', { screen: 'Notifications' });
    };
    const unsubscribeNotifeePressed = notifee.onForegroundEvent(({ type }) => {
      if (type === EventType.PRESS) openInbox();
    });

    const registerToken = async (deviceToken: string) => {
      if (!active) return;
      await registerPushDevice({ token: deviceToken, platform }).unwrap();
    };

    const setupPushNotifications = async () => {
      try {
        const firebaseMessaging = getMessaging(getApp());
        if (Platform.OS === 'android') {
          await notifee.createChannel({
            id: 'group-updates',
            name: 'Group updates',
            importance: AndroidImportance.HIGH,
          });
        }
        const permission = await notifee.requestPermission();
        if (permission.authorizationStatus < AuthorizationStatus.AUTHORIZED) return;

        await registerToken(await getToken(firebaseMessaging));
        unsubscribeTokenRefresh = onTokenRefresh(firebaseMessaging, deviceToken => {
          registerToken(deviceToken).catch(error => {
            console.warn('Could not update the push notification token.', error);
          });
        });
        unsubscribeForegroundMessage = onMessage(firebaseMessaging, async message => {
          dispatch(apiSlice.util.invalidateTags(['Notifications']));
          try {
            await notifee.displayNotification({
              title: message.notification?.title ?? 'Money Splitzy',
              body: message.notification?.body ?? 'You have a group update.',
              data: message.data,
              android: {
                channelId: 'group-updates',
                pressAction: { id: 'default' },
              },
            });
          } catch (error) {
            console.warn('Could not display the foreground notification.', error);
          }
        });
        unsubscribeNotificationOpened = onNotificationOpenedApp(firebaseMessaging, openInbox);
        const initialMessage = await getInitialNotification(firebaseMessaging);
        if (initialMessage) openInbox();
      } catch (error) {
        console.warn('Push notification setup failed. Check Firebase app configuration.', error);
      }
    };

    setupPushNotifications().catch(error => {
      console.warn('Push notification setup did not complete.', error);
    });

    return () => {
      active = false;
      unsubscribeTokenRefresh?.();
      unsubscribeForegroundMessage?.();
      unsubscribeNotificationOpened?.();
      unsubscribeNotifeePressed();
    };
  }, [dispatch, navigation, registerPushDevice, token]);

  return (
    <Tab.Navigator
      initialRouteName="Groups"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#167A4A',
        tabBarInactiveTintColor: '#8B9790',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginTop: 2 },
        tabBarItemStyle: { paddingVertical: 5 },
        tabBarStyle: {
          height: 67,
          paddingTop: 7,
          paddingBottom: 7,
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E6EBE7',
          borderTopWidth: 1,
          elevation: 12,
        },
      }}
    >
      <Tab.Screen
        name="Groups"
        component={GroupsScreen}
        options={{ tabBarIcon: GroupsTabIcon }}
      />
      <Tab.Screen
        name="Activity"
        component={ActivityScreen}
        options={{ tabBarIcon: ActivityTabIcon }}
      />
      <Tab.Screen
        name="Balances"
        component={DashboardScreen}
        options={{ tabBarIcon: BalancesTabIcon }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ProfileTabIcon }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarIcon: NotificationsTabIcon,
          tabBarBadge: unreadCount > 0 ? Math.min(unreadCount, 99) : undefined,
          tabBarBadgeStyle: { backgroundColor: '#D94F4F', fontSize: 10 },
        }}
      />
    </Tab.Navigator>
  );
}

export const AppNavigator = () => {
  const { token, isCheckingSession } = useAppSelector(state => state.auth);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isCheckingSession ? (
        <Stack.Screen name="Splash" component={SplashScreen} />
      ) : token ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
          <Stack.Screen name="GroupDetails" component={GroupDetailsScreen} />
          <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
          <Stack.Screen name="InviteMember" component={InviteMemberScreen} />
          <Stack.Screen name="AcceptInvitation" component={AcceptInvitationScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};
