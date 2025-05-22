import React, { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import SidebarMobile from '../components/SidebarMobile';

const ProfileScreen = () => {
  const { token } = useContext(AuthContext);
  const { dark } = useContext(ThemeContext);
  const { user } = useContext(AuthContext); // user contient prenom, nom, email, role
  const [formData, setFormData] = useState({
    prenom: user?.prenom || '',
    nom: user?.nom || '',
    email: user?.email || '',
    password: '',
  });

  const styles = createStyles(dark);

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    alert('Fonction de mise à jour non encore implémentée');
  };

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <SidebarMobile />
      <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
        <Text style={styles.title}>Profil de {user?.prenom}</Text>
        <Text style={styles.role}>Rôle : {user?.role}</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Prénom :</Text>
          <TextInput
            style={styles.input}
            value={formData.prenom}
            onChangeText={(text) => handleChange('prenom', text)}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Nom :</Text>
          <TextInput
            style={styles.input}
            value={formData.nom}
            onChangeText={(text) => handleChange('nom', text)}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email :</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => handleChange('email', text)}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Mot de passe :</Text>
          <TextInput
            style={styles.input}
            placeholder="Nouveau mot de passe (facultatif)"
            secureTextEntry
            value={formData.password}
            onChangeText={(text) => handleChange('password', text)}
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveText}>Enregistrer</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const createStyles = (dark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dark ? '#000' : '#f3f4f6',
  },
  inner: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: dark ? '#fff' : '#111',
    marginBottom: 10,
  },
  role: {
    fontSize: 14,
    color: dark ? '#ccc' : '#666',
    marginBottom: 20,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontWeight: '600',
    color: dark ? '#ccc' : '#333',
    marginBottom: 6,
  },
  input: {
    backgroundColor: dark ? '#1e293b' : '#fff',
    color: dark ? '#fff' : '#000',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: dark ? '#555' : '#ccc',
  },
  saveButton: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 20,
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ProfileScreen;