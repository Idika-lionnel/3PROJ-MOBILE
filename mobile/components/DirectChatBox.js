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
import { Ionicons } from '@expo/vector-icons';
import socket from '../socket';
import axios from 'axios';
import * as DocumentPicker from 'expo-document-picker';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';

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

      const alreadyExists = log.some((m) => m._id && msg._id && m._id === msg._id);

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

    if (item.attachmentUrl) {
      const isMeStyle = isMe ? styles.bubbleMe : styles.bubbleYou;
      return (
        <View style={styles.messageBlock}>
          <View style={isMeStyle}>
            <TouchableOpacity onPress={() => Linking.openURL(fullUrl)}>
              <Text style={{ color: isMe ? '#fff' : '#224262' }}>
                📎 {item.attachmentUrl.split('/').pop()}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={timestampStyle}>{timestamp}</Text>
        </View>
      );
    }

    const isMeStyle = isMe ? styles.bubbleMe : styles.bubbleYou;
    return (
      <View style={styles.messageBlock}>
        <View style={isMeStyle}>
          <Text style={isMe ? styles.text : styles.textYou}>{item.message}</Text>
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
          <View style={styles.footerBar}>
            <View style={styles.inputContainer}>
              <TextInput
                value={message}
                onChangeText={setMessage}
                style={styles.inputWebStyle}
                placeholder="Message ....."
                placeholderTextColor="#999"
              />
            </View>
            <TouchableOpacity onPress={sendFile}>
              <Ionicons name="add" size={24} color="#999" />
            </TouchableOpacity>
            <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
              <Ionicons name="arrow-up" size={24} color="#fff" />
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
  footerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    gap: 10,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f1f1f1',
    borderRadius: 20,
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 6,
  },
  inputWebStyle: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 6,
    color: '#000',
  },
  sendButton: {
    backgroundColor: '#1877F2',
    borderRadius: 14,
    padding: 10,
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
    backgroundColor: '#e3f1ff', // ancienne couleur
    borderRadius: 12,
    padding: 10,
    maxWidth: '70%',
  },
  text: { color: '#fff' },
  textYou: {
    color: '#224262',
  },
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
