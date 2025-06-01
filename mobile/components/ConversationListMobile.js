import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet
} from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';

const ConversationListMobile = ({ onSelect, selectedId }) => {
  const { token } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const userRes = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const user = userRes.data.user;

        const res = await axios.get(`${API_URL}/api/conversations/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // ✅ Utiliser directement la structure renvoyée par le backend
        setConversations(res.data);
      } catch (err) {
        console.error('Erreur chargement conversations :', err);
      }
    };

    fetchConversations();
  }, []);

  const filtered = conversations.filter(c => {
    const full = `${c.otherUser?.prenom || ''} ${c.otherUser?.nom || ''}`.toLowerCase();
    return full.includes(search.toLowerCase());
  });

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Rechercher..."
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filtered}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.contact,
              item._id === selectedId ? styles.selected : null
            ]}
            onPress={() => onSelect(item.otherUser)}
          >
            <View style={styles.row}>
              <Text style={styles.name}>
                {item.otherUser?.prenom} {item.otherUser?.nom}
              </Text>
              {item.lastHour && (
                <Text style={styles.hour}>{item.lastHour}</Text>
              )}
            </View>
            <Text style={styles.message}>
              {item.lastMessage ? item.lastMessage : 'Nouveau message'}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  search: {
    backgroundColor: '#f3f4f6',
    padding: 10,
    margin: 10,
    borderRadius: 6
  },
  contact: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#ddd'
  },
  selected: {
    backgroundColor: '#e0e7ff'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#111'
  },
  hour: {
    fontSize: 12,
    color: '#666'
  },
  message: {
    fontSize: 14,
    color: '#444',
    marginTop: 2
  }
});

export default ConversationListMobile;
