import React from 'react';
import { View, Text, Button } from 'react-native';

export default function RegisterScreen({ navigation }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Écran d'inscription</Text>
      <Button title="Connexion" onPress={() => navigation.navigate('Login')} />
    </View>
  );
}