import { Stack } from "expo-router";
import React from "react";

// Settings Stack
const SettingsStack = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="accountInformation" />
      <Stack.Screen name="kyc" />
      <Stack.Screen name="verifynin" />
      <Stack.Screen name="verifyfacialIdentity" />
      <Stack.Screen name="kycsuccess" />
      <Stack.Screen name="security" />
      <Stack.Screen name="changetheme" />
      <Stack.Screen name="paymentbank" />
      <Stack.Screen name="support" />
      <Stack.Screen name="newpin" />
      <Stack.Screen name="changepin" />
      <Stack.Screen name="referfriends" />
      <Stack.Screen name="addBank" />
      <Stack.Screen name="changepassword" />
    </Stack>
  );
};

export default SettingsStack;
