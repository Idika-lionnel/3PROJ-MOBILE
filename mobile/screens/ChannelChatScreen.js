import React, { useEffect, useState, useContext, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Image, Linking, Alert, Modal
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { API_URL } from '../config';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { createStyles } from '../components/channelChatStyles';


const emojiOptions = ['❤️', '😂', '😮', '😢', '👍', '👎'];

const ChannelChatScreen = () => {
  const { params } = useRoute();
  const { channelId } = params;
  const { token, user } = useContext(AuthContext);
  const { dark } = useContext(ThemeContext);
  const styles = createStyles(dark);
  const flatListRef = useRef();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [channelName, setChannelName] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showReactionsFor, setShowReactionsFor] = useState(null);
  const [reactionDetail, setReactionDetail] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);


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

      setMessages((prev) => [...prev, res.data]);
      setInput('');
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (err) {
      console.error('Erreur envoi message :', err.response?.data || err.message);
    }
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log('⚠️ Sélection annulée ou vide');
        return;
      }

      const file = result.assets[0];

      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
      });

      const res = await axios.post(`${API_URL}/api/channels/upload/channel/${channelId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessages((prev) => [...prev, res.data]);
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (err) {
      console.error('❌ Erreur upload fichier :', err.message, err.response?.data);
      Alert.alert('Erreur', 'Échec de l’envoi');
    }
  };

  const toggleReaction = async (messageId, currentReaction, emoji) => {
    try {
      if (currentReaction) {
        await axios.request({
          url: `${API_URL}/api/channels/reaction/${messageId}`,
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
          data: { userId: user._id }, // attention : pas params
        });
      }else {
        await axios.post(`${API_URL}/api/channels/reaction/${messageId}`, {
          emoji,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      const res = await axios.get(`${API_URL}/api/channels/${channelId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);
    } catch (err) {
      console.error('Erreur réaction emoji :', err.response?.data || err.message);
    }
  };

  const renderItem = ({ item }) => {
    const isMine = item.senderId._id === user._id;
    const imageUrl = item.attachmentUrl?.replace('localhost', API_URL.replace(/^https?:\/\//, ''));


    return (
      <View style={{ marginVertical: 4 }}>
        <View style={[styles.messageBubble, isMine ? styles.myMessage : styles.otherMessage]}>
          <Text style={styles.senderText}>{item.senderId.prenom} :</Text>

          {item.content && (
            <TouchableOpacity onLongPress={() => setShowReactionsFor(item._id)}>
              <Text style={styles.messageText}>{item.content}</Text>
            </TouchableOpacity>
          )}

          {item.attachmentUrl && (
            item.attachmentUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
              <TouchableOpacity onPress={() => {
                setSelectedImage(imageUrl);
                setIsModalVisible(true);
              }} onLongPress={() => setShowReactionsFor(item._id)}>
                <Image source={{ uri: imageUrl }} style={{ width: 180, height: 180, borderRadius: 10, marginTop: 5 }} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => Linking.openURL(item.attachmentUrl)} onLongPress={() => setShowReactionsFor(item._id)}>
                <Text style={styles.fileLink}>📄 {item.attachmentUrl.split('/').pop()}</Text>
              </TouchableOpacity>
            )
          )}

          <Text style={styles.timestamp}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {item.reactions?.length > 0 && (
          <View style={{ flexDirection: 'row', marginTop: 4, marginLeft: isMine ? 'auto' : 10 }}>
            {item.reactions.map((r, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setReactionDetail({ emoji: r.emoji, users: item.reactions.filter(e => e.emoji === r.emoji) })}
              >
                <Text style={{ fontSize: 12, backgroundColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 6, marginRight: 4 }}>{r.emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {showReactionsFor === item._id && (
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 4 }}>
            {/* Croisement direct */}
            <TouchableOpacity
              onPress={async () => {
                try {
                  await axios.request({
                    url: `${API_URL}/api/channels/reaction/${item._id}`,
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` },
                    data: { userId: user._id },
                  });

                  const res = await axios.get(`${API_URL}/api/channels/${channelId}/messages`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  setMessages(res.data);
                } catch (err) {
                  console.error('Erreur suppression réaction via ❌ :', err.response?.data || err.message);
                } finally {
                  setShowReactionsFor(null);
                }
              }}
              style={{ marginHorizontal: 6 }}
            >
              <Text style={{ fontSize: 20, color: 'red' }}>❌</Text>
            </TouchableOpacity>

            {emojiOptions.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                onPress={() => {
                  toggleReaction(item._id, null, emoji); // 👈 garde ce format si tu veux conserver currentReaction
                  setShowReactionsFor(null);
                }}
              >
                <Text style={{ fontSize: 22, marginHorizontal: 4 }}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

              >
                <Text style={{ fontSize: 22, marginHorizontal: 4 }}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };
const filteredMessages = messages.filter(msg =>
  (msg.content && msg.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
  (msg.senderId?.prenom && msg.senderId.prenom.toLowerCase().includes(searchQuery.toLowerCase())) ||
  (msg.attachmentUrl && msg.attachmentUrl.toLowerCase().includes(searchQuery.toLowerCase()))
);
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.headerRow}>
        <Text style={styles.channelTitle}>#{channelName}</Text>

        {showSearchInput && (
          <TextInput
            placeholder="Rechercher..."
            placeholderTextColor="#999"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        )}

        <TouchableOpacity onPress={() => setShowSearchInput(!showSearchInput)} style={styles.searchIconContainer}>
          <Ionicons name="search" size={22} color={dark ? '#fff' : '#000'} />
        </TouchableOpacity>
      </View>



      <FlatList
        ref={flatListRef}
       data={filteredMessages}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.footerBar}>
        <View style={styles.inputContainer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            style={styles.inputWebStyle}
            placeholder="Message..."
            placeholderTextColor="#999"
          />
        </View>
        <TouchableOpacity onPress={handlePickFile}>
          <Ionicons name="add" size={24} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
          <Ionicons name="arrow-up" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <Modal visible={isModalVisible} transparent>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => setIsModalVisible(false)}
        >
          <Image
            source={{ uri: selectedImage }}
            style={{ width: '90%', height: '80%', resizeMode: 'contain' }}
          />
        </TouchableOpacity>
      </Modal>
      <Modal visible={!!reactionDetail} transparent animationType="fade">
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => setReactionDetail(null)}
        >
          <View style={{ backgroundColor: '#fff', padding: 20, borderRadius: 10 }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Réactions {reactionDetail?.emoji}</Text>
            {reactionDetail?.users?.map((r, i) => (
              <Text key={i}>{r.userId?.prenom || 'Utilisateur inconnu'}</Text>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

    </KeyboardAvoidingView>
  );

};



export default ChannelChatScreen;
