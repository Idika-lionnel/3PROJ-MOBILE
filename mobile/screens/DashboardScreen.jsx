// screens/DashboardScreen.jsx
import React, { useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { AuthContext } from '../context/AuthContext';

const dummyWorkspaces = [
  { id: '1', name: 'Marketing' },
  { id: '2', name: 'Développement' },
  { id: '3', name: 'RH' },
];

export default function DashboardScreen() {
  const { logout } = useContext(AuthContext);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mes Espaces de travail</Text>
      <FlatList
        data={dummyWorkspaces}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.workspace}>
            <Text style={styles.name}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity onPress={logout} style={styles.logout}>
        <Text style={{ color: 'white' }}>Déconnexion</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, marginTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  workspace: { backgroundColor: '#eee', padding: 15, borderRadius: 10, marginBottom: 10 },
  name: { fontSize: 18 },
  logout: { marginTop: 20, backgroundColor: '#333', padding: 10, borderRadius: 8, alignItems: 'center' },
});