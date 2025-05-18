// screens/LoginScreen.jsx
import React, { useState, useContext } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token);
    } catch (err) {
      alert('Erreur de connexion');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SUPCHAT</Text>
      <TextInput placeholder="Email" style={styles.input} onChangeText={setEmail} />
      <TextInput placeholder="Mot de passe" style={styles.input} secureTextEntry onChangeText={setPassword} />
      <Button title="Connexion" onPress={handleLogin} />
      <Text onPress={() => navigation.navigate('Register')} style={styles.link}>
        Pas encore de compte ? Inscription
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, marginTop: 100 },
  title: { fontSize: 30, textAlign: 'center', marginBottom: 30 },
  input: { borderWidth: 1, marginBottom: 15, padding: 10, borderRadius: 5 },
  link: { color: 'blue', marginTop: 10, textAlign: 'center' },
});