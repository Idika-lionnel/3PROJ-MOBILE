import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, StyleSheet } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const ConversationListMobile = ({ onSelect, selectedId }) => {
  const { token } = React.useContext(AuthContext);
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchConversations = async () => {
      const userRes = await axios.get('http://192.168.0.42:5050/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const user = userRes.data.user;

      const res = await axios.get(`http://192.168.0.42:5050/api/conversations/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const enriched = res.data.map(conv => {
        const other = conv.participants.find(p => p._id !== user._id);
        return {
          ...other,
          lastMessage: conv.lastMessage,
          lastHour: conv.lastHour
        };
      });

      setContacts(enriched);
    };

    fetchConversations();
  }, []);

  const filtered = contacts.filter(c => {
    const full = `${c.prenom} ${c.nom}`.toLowerCase();
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
            onPress={() => onSelect(item)}
          >
            <Text style={styles.name}>{item.prenom} {item.nom}</Text>
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
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#ddd'
  },
  selected: {
    backgroundColor: '#e0e7ff'
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16
  },
  message: {
    fontSize: 12,
    color: '#666'
  }
});

export default ConversationListMobile;