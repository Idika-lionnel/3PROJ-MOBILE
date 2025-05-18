import React from 'react';
import { View, Text, Button } from 'react-native';

export default function LoginScreen({ navigation }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Écran de connexion</Text>
      <Button title="S'inscrire" onPress={() => navigation.navigate('Register')} />
      <Button title="Dashboard" onPress={() => navigation.navigate('Dashboard')} />
    </View>
  );
}