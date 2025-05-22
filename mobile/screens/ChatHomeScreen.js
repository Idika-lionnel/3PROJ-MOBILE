import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { ThemeContext } from '../context/ThemeContext';

const API_URL = 'http://192.168.0.42:5050';

const ChatHomeScreen = () => {
  const navigation = useNavigation();
  const { token } = useContext(AuthContext);
  const { dark } = useContext(ThemeContext);
  const [userId, setUserId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedTab, setSelectedTab] = useState('all');

  useEffect(() => {
    axios.get(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setUserId(res.data.user._id));
  }, []);

  useEffect(() => {
    if (!userId) return;
    axios.get(`${API_URL}/api/conversations/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setConversations(res.data));

    axios.get(`${API_URL}/users/all`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      const filtered = res.data.filter(u => u._id !== userId);
      setContacts(filtered);
    });
  }, [userId]);

  const getFilteredData = () => {
    if (selectedTab === 'unread') {
      return conversations.filter(conv => conv.unreadCount > 0);
    }
    return selectedTab === 'contacts' ? contacts : conversations.map(conv => {
      const other = conv.participants.find(p => p._id !== userId);
      return { ...other, lastMessage: conv.lastMessage };
    });
  };

  const styles = createStyles(dark);

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {['all', 'unread', 'contacts'].map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setSelectedTab(tab)}
            style={[styles.tab, selectedTab === tab && styles.tabSelected]}
          >
            <Text style={styles.tabText}>{tab.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={getFilteredData()}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate('DirectChat', { receiver: item })}
          >
            <Text style={styles.name}>{item.prenom} {item.nom}</Text>
            {item.lastMessage && <Text style={styles.last}>{item.lastMessage}</Text>}
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const createStyles = (dark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dark ? '#111827' : '#f9fafb',
    padding: 10,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  tabSelected: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    color: '#111827',
    fontWeight: 'bold',
  },
  item: {
    backgroundColor: dark ? '#1f2937' : '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  name: {
    color: dark ? '#fff' : '#111827',
    fontWeight: 'bold',
  },
  last: {
    color: dark ? '#d1d5db' : '#6b7280',
    fontSize: 12,
  },
});

export default ChatHomeScreen;
