import React, { useEffect, useState, useContext } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text, Alert, Image } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

WebBrowser.maybeCompleteAuthSession();

const API_URL = 'http://192.168.0.42:5050'; // adapte à ton IP

const LoginScreen = ({ navigation }) => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Google Auth (client Android)
  const [googleRequest, googleResponse, promptGoogleLogin] = Google.useAuthRequest({
    clientId: '897794245642-48h4khm619m0bd26h0sjgcuj5alctfos.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { authentication } = googleResponse;
      axios
        .get(`${API_URL}/api/auth/google/mobile?access_token=${authentication.accessToken}`)
        .then(res => login(res.data.token))
        .catch(err => Alert.alert('Erreur Google', err.message));
    }
  }, [googleResponse]);

  const handleLogin = () => {
    axios
      .post(`${API_URL}/api/auth/login`, { email, password })
      .then(res => login(res.data.token))
      .catch(err => Alert.alert('Erreur', err.response?.data?.error || 'Connexion échouée'));
  };

  return (
    <View style={styles.container}>
      <View style={styles.box}>
        <Text style={styles.title}>Connexion à SUPCHAT</Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#999"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          placeholder="Mot de passe"
          placeholderTextColor="#999"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Se connecter</Text>
        </TouchableOpacity>

        {/* Bouton Google */}
        <TouchableOpacity
          style={styles.googleButton}
          onPress={() => promptGoogleLogin()}
          disabled={!googleRequest}
        >
          <Image
            source={{ uri: 'https://img.icons8.com/color/48/google-logo.png' }}
            style={styles.googleIcon}
          />
          <Text style={styles.googleText}>Connexion avec Google</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          Pas encore de compte ?{' '}
          <Text style={styles.link} onPress={() => navigation.navigate('Register')}>
            Inscription
          </Text>
        </Text>
      </View>
    </View>
  );
};

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
  googleButton: {
    backgroundColor: '#db4437',
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  googleText: {
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

export default LoginScreen;