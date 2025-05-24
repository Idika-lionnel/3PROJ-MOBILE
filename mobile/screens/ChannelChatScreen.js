import React, { useEffect, useState, useContext, useRef } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRoute } from '@react-navigation/native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

const API_URL = 'http://192.168.0.42:5050';

const ChannelChatScreen = () => {
  const { params } = useRoute();
  const { channelId, workspaceId } = params;
  const { token, user } = useContext(AuthContext);
  const { dark } = useContext(ThemeContext);
  const styles = createStyles(dark);
  const flatListRef = useRef();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [channelName, setChannelName] = useState('');

  // 🔁 Charger les messages du canal
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/channels/${channelId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(res.data);
      } catch (err) {
        console.error('Erreur chargement messages :', err.response?.data || err.message);
      }
    };

    const fetchChannel = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/channels/${channelId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setChannelName(res.data.name);
      } catch (err) {
        console.error('Erreur chargement canal :', err.response?.data || err.message);
      }
    };

    if (channelId && token) {
      fetchMessages();
      fetchChannel();
    }
  }, [channelId]);

  const handleSend = async () => {
    if (!input.trim()) return;

    try {
      const res = await axios.post(`${API_URL}/api/channels/${channelId}/messages`, {
        content: input,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessages(prev => [...prev, res.data]);
      setInput('');
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (err) {
      console.error('Erreur envoi message :', err.response?.data || err.message);
    }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.messageBubble, item.senderId._id === user._id ? styles.myMessage : styles.otherMessage]}>
      <Text style={styles.messageText}>
        <Text style={{ fontWeight: 'bold' }}>{item.senderId.prenom} : </Text>
        {item.content}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.channelTitle}>#{channelName}</Text>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        <TextInput
          value={input}
          onChangeText={setInput}
          style={styles.input}
          placeholder="Écrire un message..."
          placeholderTextColor={dark ? '#aaa' : '#555'}
        />
        <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Envoyer</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const createStyles = (dark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: dark ? '#0f172a' : '#f3f4f6',
      padding: 10,
    },
    channelTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: dark ? '#fff' : '#111',
      marginBottom: 10,
    },
    messagesList: {
      paddingBottom: 20,
    },
    messageBubble: {
      marginVertical: 4,
      padding: 10,
      borderRadius: 8,
      maxWidth: '80%',
    },
    myMessage: {
      alignSelf: 'flex-end',
      backgroundColor: '#3b82f6',
    },
    otherMessage: {
      alignSelf: 'flex-start',
      backgroundColor: dark ? '#1e293b' : '#e5e7eb',
    },
    messageText: {
      color: '#fff',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 10,
    },
    input: {
      flex: 1,
      backgroundColor: dark ? '#1e293b' : '#fff',
      color: dark ? '#fff' : '#000',
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#ccc',
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginRight: 10,
    },
    sendButton: {
      backgroundColor: '#2563eb',
      padding: 10,
      borderRadius: 6,
    },
    sendButtonText: {
      color: '#fff',
      fontWeight: '600',
    },
  });

export default ChannelChatScreen;