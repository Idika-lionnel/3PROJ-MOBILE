import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Image } from 'react-native';
import socket from '../socket';
import axios from 'axios';
import * as DocumentPicker from 'expo-document-picker';

const API_URL = 'http://192.168.0.42:5050';

const DirectChatBox = ({ receiver, contacts, currentUserId }) => {
  const [log, setLog] = useState([]);
  const [message, setMessage] = useState('');
  const flatRef = useRef();

  const fetchMessages = async () => {
    const res = await axios.get(`${API_URL}/api/messages/${receiver._id}?currentUserId=${currentUserId}`);
    setLog(res.data);
  };

  useEffect(() => {
    if (!receiver?._id) return;
    fetchMessages();
  }, [receiver]);

  useEffect(() => {
    socket.emit('join', currentUserId);
    const handler = (msg) => {
      const isForThisChat = msg.senderId === receiver._id || msg.receiverId === receiver._id;
      if (isForThisChat) setLog(prev => [...prev, msg]);
    };
    socket.on('new_direct_message', handler);
    return () => socket.off('new_direct_message', handler);
  }, [receiver]);

  const sendMessage = () => {
    if (!message.trim()) return;
    const msg = {
      senderId: currentUserId,
      receiverId: receiver._id,
      message,
      type: 'text',
      timestamp: new Date().toISOString()
    };
    socket.emit('direct_message', msg);
    setLog(prev => [...prev, msg]);
    setMessage('');
  };

  const sendFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: '*/*' });
    if (res.canceled) return;

    const formData = new FormData();
    formData.append('file', {
      uri: res.assets[0].uri,
      name: res.assets[0].name,
      type: res.assets[0].mimeType || 'application/octet-stream',
    });
    formData.append('senderId', currentUserId);
    formData.append('receiverId', receiver._id);
    formData.append('type', 'file');

    const result = await axios.post(`${API_URL}/api/messages/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    setLog(prev => [...prev, result.data]);
  };

  const renderItem = ({ item }) => {
    const isMe = item.senderId === currentUserId;
    const style = isMe ? styles.bubbleMe : styles.bubbleYou;

    if (item.attachmentUrl) {
      const isImg = /\.(jpg|jpeg|png|gif)$/i.test(item.attachmentUrl);
      return (
        <View style={style}>
          {isImg ? (
            <Image source={{ uri: item.attachmentUrl }} style={{ width: 150, height: 150, borderRadius: 8 }} />
          ) : (
            <TouchableOpacity onPress={() => Linking.openURL(item.attachmentUrl)}>
              <Text style={{ color: '#fff' }}>📎 {item.attachmentUrl.split('/').pop()}</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return <View style={style}><Text style={styles.text}>{item.message}</Text></View>;
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatRef}
        data={log}
        renderItem={renderItem}
        keyExtractor={(item, i) => i.toString()}
        onContentSizeChange={() => flatRef.current.scrollToEnd({ animated: true })}
      />
      <View style={styles.row}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          style={styles.input}
          placeholder="Message..."
        />
        <TouchableOpacity onPress={sendFile}>
          <Text style={styles.icon}>📎</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={sendMessage}>
          <Text style={styles.icon}>📤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  icon: { fontSize: 20 },
  bubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 10,
    marginVertical: 4,
    maxWidth: '70%',
  },
  bubbleYou: {
    alignSelf: 'flex-start',
    backgroundColor: '#ddd',
    borderRadius: 12,
    padding: 10,
    marginVertical: 4,
    maxWidth: '70%',
  },
  text: { color: '#fff' }
});

export default DirectChatBox;