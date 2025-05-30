// mobile/components/DirectChatBox.js
import { format } from 'date-fns';
import React, { useEffect, useRef, useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  Linking,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import socket from '../socket';
import axios from 'axios';
import * as DocumentPicker from 'expo-document-picker';
import { AuthContext } from '../context/AuthContext';

const API_URL = 'http://192.168.30.125:5050';

const DirectChatBox = ({ receiver, contacts, currentUserId: propUserId }) => {
  const { user } = useContext(AuthContext);
  const currentUserId = propUserId || user?._id;

  const [log, setLog] = useState([]);
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const flatRef = useRef();

  const fetchMessages = async () => {
    if (!receiver?._id || !currentUserId) return;
    const res = await axios.get(`${API_URL}/api/messages/${receiver._id}?currentUserId=${currentUserId}`);
    setLog(res.data);
  };

  useEffect(() => {
    if (receiver?._id && currentUserId) {
      fetchMessages();
    }
  }, [receiver]);

  useEffect(() => {
    if (!currentUserId) return;

    socket.emit('join', currentUserId);

    const handler = (msg) => {
      const isForThisChat =
        msg.senderId === receiver._id || msg.receiverId === receiver._id;

      const alreadyExists = log.some(
        (m) => m._id && msg._id && m._id === msg._id
      );

      if (isForThisChat && !alreadyExists) {
        setLog((prev) => [...prev, msg]);
      }
    };

    socket.on('new_direct_message', handler);
    return () => socket.off('new_direct_message', handler);
  }, [receiver, log]);

  const sendMessage = () => {
    if (!message.trim() || !currentUserId || !receiver?._id) return;

    const msg = {
      senderId: currentUserId,
      receiverId: receiver._id,
      message,
      type: 'text',
      timestamp: new Date().toISOString(),
    };

    socket.emit('direct_message', msg);
    setLog((prev) => [...prev, msg]);
    setMessage('');
  };

  const sendFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: '*/*' });
    if (res.canceled) return;

    const file = res.assets[0];
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType || 'application/octet-stream',
    });
    formData.append('senderId', currentUserId);
    formData.append('receiverId', receiver._id);
    formData.append('type', 'file');

    try {
      const result = await axios.post(`${API_URL}/api/messages/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      socket.emit('direct_message', result.data);
    } catch (err) {
      console.error('Erreur envoi fichier :', err.response?.data || err.message);
    }
  };

  const renderItem = ({ item }) => {
    const isMe = item.senderId === currentUserId;
    const fullUrl = item.attachmentUrl?.replace('http://localhost:5050', API_URL);
    const timestamp = item.timestamp ? format(new Date(item.timestamp), 'HH:mm') : '';
    const timestampStyle = isMe ? styles.timestampRight : styles.timestampLeft;

    // ✅ Images en dehors des bulles
    if (item.attachmentUrl && /\.(jpg|jpeg|png|gif)$/i.test(item.attachmentUrl)) {
      return (
        <View style={styles.messageBlock}>
          <TouchableOpacity
            onPress={() => {
              setSelectedImage(fullUrl);
              setIsModalVisible(true);
            }}
            style={{ alignSelf: isMe ? 'flex-end' : 'flex-start' }}
          >
            <Image source={{ uri: fullUrl }} style={styles.image} />
          </TouchableOpacity>
          <Text style={timestampStyle}>{timestamp}</Text>
        </View>
      );
    }

    // ✅ Fichiers dans une bulle
    if (item.attachmentUrl) {
      const isMeStyle = isMe ? styles.bubbleMe : styles.bubbleYou;
      return (
        <View style={styles.messageBlock}>
          <View style={isMeStyle}>
            <TouchableOpacity onPress={() => Linking.openURL(fullUrl)}>
              <Text style={{ color: '#fff' }}>📎 {item.attachmentUrl.split('/').pop()}</Text>
            </TouchableOpacity>
          </View>
          <Text style={timestampStyle}>{timestamp}</Text>
        </View>
      );
    }

    // ✅ Message texte dans une bulle
    const isMeStyle = isMe ? styles.bubbleMe : styles.bubbleYou;
    return (
      <View style={styles.messageBlock}>
        <View style={isMeStyle}>
          <Text style={styles.text}>{item.message}</Text>
        </View>
        <Text style={timestampStyle}>{timestamp}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={styles.container}>
          <FlatList
            ref={flatRef}
            data={log}
            renderItem={renderItem}
            keyExtractor={(item, i) => i.toString()}
            onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
            style={{ flex: 1 }}
          />
          <View style={styles.inputBar}>
            <TextInput
              value={message}
              onChangeText={setMessage}
              style={styles.input}
              placeholder="Message..."
              placeholderTextColor="#888"
            />
            <TouchableOpacity onPress={sendFile}>
              <Text style={styles.icon}>📎</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={sendMessage}>
              <Text style={styles.icon}>📤</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Modal visible={isModalVisible} transparent={true}>
          <Pressable style={styles.modalOverlay} onPress={() => setIsModalVisible(false)}>
            <Image source={{ uri: selectedImage }} style={styles.fullImage} resizeMode="contain" />
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingBottom: Platform.OS === 'android' ? 12 : 24,
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 10,
    borderRadius: 20,
    marginRight: 8,
    color: '#000',
  },
  icon: { fontSize: 20 },
  messageBlock: {
    marginVertical: 6,
    paddingHorizontal: 10,
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 10,
    maxWidth: '70%',
  },
  bubbleYou: {
    alignSelf: 'flex-start',
    backgroundColor: '#ddd',
    borderRadius: 12,
    padding: 10,
    maxWidth: '70%',
  },
  text: { color: '#fff' },
  image: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  timestampLeft: {
    fontSize: 10,
    color: '#888',
    alignSelf: 'flex-start',
    marginTop: 2,
    marginLeft: 10,
  },
  timestampRight: {
    fontSize: 10,
    color: '#888',
    alignSelf: 'flex-end',
    marginTop: 2,
    marginRight: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '90%',
    height: '80%',
  },
});

export default DirectChatBox;
