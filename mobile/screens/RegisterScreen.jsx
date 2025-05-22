import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import api from '../services/api';

export default function RegisterScreen({ navigation }) {
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    if (!prenom || !nom || !email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      const res = await api.post('/auth/register', {
        prenom,
        nom,
        email,
        password,
      });
      Alert.alert('Succès', 'Inscription réussie ! Vous pouvez maintenant vous connecter.');
      navigation.navigate('Login');
    } catch (err) {
      console.error(err.response?.data || err.message);
      Alert.alert('Erreur', err.response?.data?.message || 'Erreur lors de l’inscription');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.box}>
        <Text style={styles.title}>Inscription à SUPCHAT</Text>

        <TextInput
          placeholder="Prénom"
          placeholderTextColor="#999"
          style={styles.input}
          value={prenom}
          onChangeText={setPrenom}
        />

        <TextInput
          placeholder="Nom"
          placeholderTextColor="#999"
          style={styles.input}
          value={nom}
          onChangeText={setNom}
        />

        <TextInput
          placeholder="Email"
          placeholderTextColor="#999"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          placeholder="Mot de passe"
          placeholderTextColor="#999"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>S'inscrire</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          Déjà inscrit ?{' '}
          <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
            Se connecter
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  box: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 12,
    width: '85%',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
    color: '#111',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    color: '#333',
    marginTop: 5,
  },
  link: {
    color: '#2563eb',
    fontWeight: '500',
  },
});