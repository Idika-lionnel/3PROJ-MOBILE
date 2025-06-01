import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { API_URL } from '../config';
import socket from '../socket';
import axios from 'axios';

const ChatHomeScreen = () => {
  const navigation = useNavigation();
  const { token } = useContext(AuthContext);
  const { dark } = useContext(ThemeContext);
  const [userId, setUserId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedTab, setSelectedTab] = useState('all');

  useEffect(() => {
    const fetchUserId = async () => {
      const res = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserId(res.data.user._id);
    };
    fetchUserId();
  }, []);

  const fetchConversations = async (uid) => {
    const res = await axios.get(`${API_URL}/api/conversations/${uid}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setConversations(res.data);
  };

  useEffect(() => {
    if (!userId) return;
    fetchConversations(userId);

    axios.get(`${API_URL}/users/all`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      const filtered = res.data.filter((u) => u._id !== userId);
      setContacts(filtered);
    });

    socket.on('new_direct_message', (msg) => {
      if (
        msg.receiverId === userId ||
        msg.senderId === userId
      ) {
        fetchConversations(userId);
      }
    });

    return () => socket.off('new_direct_message');
  }, [userId]);

  const getFilteredData = () => {
    if (selectedTab === 'unread') {
      return conversations.filter((conv) => conv.unreadCount > 0);
    }

    if (selectedTab === 'contacts') {
      return contacts;
    }

    return conversations.map((conv) => {
      const other = conv.participants?.find((p) => p._id !== userId) || conv.otherUser;
      return {
        ...other,
        lastMessage: conv.lastMessage,
        lastHour: conv.lastHour,
      };
    });
  };

  const styles = createStyles(dark);

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {['all', 'unread', 'contacts'].map((tab) => (
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
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate('DirectChat', { receiver: item })}
          >
            <View style={styles.row}>
              <Text style={styles.name}>
                {item.prenom} {item.nom}
              </Text>
              {item.lastHour && (
                <Text style={styles.hour}>{item.lastHour}</Text>
              )}
            </View>
            {item.lastMessage && (
              <Text style={styles.last}>{item.lastMessage}</Text>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const createStyles = (dark) =>
  StyleSheet.create({
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
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    hour: {
      fontSize: 12,
      color: '#888',
    },
  });

export default ChatHomeScreen;
