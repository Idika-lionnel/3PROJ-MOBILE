import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import axios from 'axios';
import { API_URL } from '../config';

//const API_URL = 'http://192.168.30.125:5050';


const WorkspacesScreen = () => {
  const { token } = useContext(AuthContext);
  const { dark } = useContext(ThemeContext);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  const styles = createStyles(dark);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/workspaces`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWorkspaces(res.data);
      } catch (err) {
        console.error('Erreur chargement workspaces :', err?.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchWorkspaces();
  }, [token]);

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} size="large" />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Espaces de Travail</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateWorkspace')}>
          <Text style={styles.createButton}>+ Créer</Text>
        </TouchableOpacity>
      </View>

      {workspaces.length === 0 ? (
        <Text style={styles.empty}>Aucun espace disponible.</Text>
      ) : (
        <FlatList
          data={workspaces}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('WorkspaceDetail', { id: item._id })}
            >
              <Text style={styles.cardText}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const createStyles = (dark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: dark ? '#000' : '#f9f9f9',
      padding: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
      color: dark ? '#fff' : '#111',
    },
    createButton: {
      fontSize: 16,
      color: '#2563eb',
      fontWeight: 'bold',
    },
    empty: {
      color: dark ? '#ccc' : '#555',
      textAlign: 'center',
      marginTop: 20,
    },
    card: {
      backgroundColor: '#2563eb',
      padding: 16,
      borderRadius: 10,
      marginBottom: 12,
    },
    cardText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 16,
    },
  });

export default WorkspacesScreen;