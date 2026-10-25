import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Activity as ActivityIcon, UserRound, Users, Wallet } from 'lucide-react-native';
import type { NavigatorScreenParams } from '@react-navigation/native';
import SplashScreen from '../../features/auth/screens/SplashScreen';
import LoginScreen from '../../features/auth/screens/LoginScreen';
import RegisterScreen from '../../features/auth/screens/RegisterScreen';
import DashboardScreen from '../../features/dashboard/DashboardScreen';
import GroupsScreen from '../../features/groups/GroupsScreen';
import CreateGroupScreen from '../../features/groups/CreateGroupScreen';
import GroupDetailsScreen from '../../features/groups/GroupDetailsScreen';
import AddExpenseScreen from '../../features/groups/AddExpenseScreen';
import InviteMemberScreen from '../../features/groups/InviteMemberScreen';
import AcceptInvitationScreen from '../../features/groups/AcceptInvitationScreen';
import ActivityScreen from '../../features/activity/ActivityScreen';
import ProfileScreen from '../../features/profile/ProfileScreen';

type MainTabParamList = {
  Balances: undefined;
  Groups: undefined;
  Activity: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  CreateGroup: undefined;
  GroupDetails: { groupId: string };
  AddExpense: { groupId: string };
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

function MainTabs() {
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
    </Tab.Navigator>
  );
}

export const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
      <Stack.Screen name="GroupDetails" component={GroupDetailsScreen} />
      <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
      <Stack.Screen name="InviteMember" component={InviteMemberScreen} />
      <Stack.Screen name="AcceptInvitation" component={AcceptInvitationScreen} />
    </Stack.Navigator>
  );
};
