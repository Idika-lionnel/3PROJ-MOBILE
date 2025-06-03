import React, { useEffect, useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { API_URL } from '../config';

const WorkspaceDetailScreen = () => {
  const { params } = useRoute();
  const navigation = useNavigation();
  const { token, user } = useContext(AuthContext);
  const { dark } = useContext(ThemeContext);
  const styles = createStyles(dark);

  const [workspace, setWorkspace] = useState(null);
  const [channels, setChannels] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ name: '', description: '', isPrivate: false });
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [error, setError] = useState('');

  const workspaceId = params?.id;
  const isOwner = workspace?.createdBy?._id === user._id;

  // --- fetchData rendu réutilisable
  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/workspaces/${workspaceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWorkspace(res.data);
      setEditData({
        name: res.data.name,
        description: res.data.description || '',
        isPrivate: res.data.isPrivate || false,
      });
    } catch {
      setError('Erreur chargement workspace');
    }
  };

  const fetchChannels = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/workspaces/${workspaceId}/channels`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChannels(res.data);
    } catch (err) {
      console.error('Erreur chargement canaux', err);
    }
  };

  useEffect(() => {
    if (workspaceId && token) {
      fetchData();
      fetchChannels();
    }
  }, [workspaceId, token]);

  const handleChannelCreated = (newChannel) => {
    setChannels((prev) => [...prev, newChannel]);
  };

  const handleSaveEdit = async () => {
    try {
      const res = await axios.patch(`${API_URL}/api/workspaces/${workspaceId}`, editData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWorkspace(res.data);
      setEditMode(false);
    } catch {
      Alert.alert('Erreur', 'Échec mise à jour');
    }
  };

  const handleDelete = async () => {
    Alert.alert('Supprimer ?', 'Confirmer suppression du workspace ?', [
      { text: 'Annuler' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${API_URL}/api/workspaces/${workspaceId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            navigation.navigate('Workspaces');
          } catch {
            Alert.alert('Erreur', 'Suppression impossible');
          }
        },
      },
    ]);
  };

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) return;
    try {
      await axios.post(`${API_URL}/api/workspaces/${workspaceId}/members-by-email`, {
        email: newMemberEmail,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNewMemberEmail('');
      await fetchData(); // ✅ rafraîchissement de la liste des membres
      Alert.alert('Succès', 'Membre ajouté');
    } catch {
      Alert.alert('Erreur', 'Échec ajout membre.');
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      const res = await axios.delete(`${API_URL}/api/workspaces/${workspaceId}/members/${memberId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWorkspace(res.data);
    } catch {
      Alert.alert('Erreur', 'Impossible de retirer ce membre.');
    }
  };

  if (!workspace) return <Text style={{ padding: 20, color: 'red' }}>{error || 'Chargement...'}</Text>;

  return (
    <View style={styles.container}>
      {editMode ? (
        <>
          <TextInput
            value={editData.name}
            onChangeText={(val) => setEditData({ ...editData, name: val })}
            style={styles.input}
            placeholder="Nom"
            placeholderTextColor={dark ? '#aaa' : '#444'}
          />
          <TextInput
            value={editData.description}
            onChangeText={(val) => setEditData({ ...editData, description: val })}
            style={[styles.input, { marginBottom: 10 }]}
            placeholder="Description"
            placeholderTextColor={dark ? '#aaa' : '#444'}
          />
          <TouchableOpacity
            onPress={() => setEditData({ ...editData, isPrivate: !editData.isPrivate })}
            style={styles.toggleBtn}
          >
            <Text style={styles.toggleBtnText}>
              {editData.isPrivate ? '🔒 Privé' : '🌍 Public'}
            </Text>
          </TouchableOpacity>
          <View style={styles.editBtns}>
            <TouchableOpacity onPress={handleSaveEdit} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>💾 Enregistrer</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditMode(false)} style={styles.cancelBtn}>
              <Text style={{ color: dark ? '#fff' : '#111' }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.title}>{workspace.name}</Text>
          <Text style={styles.info}>{workspace.description || 'Aucune description'}</Text>
          <Text style={styles.info}>Visibilité : {workspace.isPrivate ? 'Privé' : 'Public'}</Text>
        </>
      )}

      {isOwner && !editMode && (
        <View style={styles.editBtns}>
          <TouchableOpacity onPress={() => setEditMode(true)} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>✏️ Modifier</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.cancelBtn}>
            <Text style={{ color: 'red' }}>🗑️ Supprimer</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionTitle}>👥 Membres</Text>
      {workspace.members.map((member) => (
        <View key={member._id} style={styles.memberRow}>
          <Text style={styles.memberText}>{member.prenom} {member.nom}</Text>
          {isOwner && member._id !== user._id && (
            <TouchableOpacity onPress={() => handleRemoveMember(member._id)}>
              <Text style={styles.removeBtn}>❌</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {isOwner && (
        <View style={styles.addMemberBox}>
          <TextInput
            style={styles.input}
            value={newMemberEmail}
            onChangeText={setNewMemberEmail}
            placeholder="email@exemple.com"
            placeholderTextColor={dark ? '#aaa' : '#555'}
          />
          <TouchableOpacity onPress={handleAddMember} style={styles.addBtn}>
            <Text style={styles.addBtnText}>➕</Text>
          </TouchableOpacity>
        </View>
      )}

      {isOwner && (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('CreateChannel', {
              workspaceId,
              onChannelCreated: handleChannelCreated,
            })
          }
          style={{
            marginTop: 30,
            backgroundColor: '#2563eb',
            padding: 12,
            borderRadius: 8,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>➕ Créer un canal</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.sectionTitle}>📢 Canaux</Text>
      {channels.length === 0 ? (
        <Text style={styles.info}>Aucun canal pour le moment.</Text>
      ) : (
        channels.map((ch) => (
          <TouchableOpacity
            key={ch._id}
            style={styles.channelBox}
            onPress={() => navigation.navigate('ChannelChat', { channelId: ch._id, workspaceId })}
          >
            <Text style={styles.channelText}># {ch.name}</Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
};

const createStyles = (dark) =>
  StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: dark ? '#000' : '#f9f9f9' },
    title: { fontSize: 22, fontWeight: 'bold', color: dark ? '#fff' : '#111' },
    info: { fontSize: 14, color: dark ? '#ccc' : '#444', marginBottom: 5 },
    sectionTitle: { fontSize: 16, fontWeight: '600', marginTop: 20, marginBottom: 8, color: dark ? '#fff' : '#111' },
    input: {
      borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 6,
      backgroundColor: dark ? '#1e293b' : '#fff', color: dark ? '#fff' : '#000'
    },
    toggleBtn: {
      backgroundColor: '#e5e7eb', padding: 10, borderRadius: 6,
      alignSelf: 'flex-start', marginBottom: 12
    },
    toggleBtnText: { color: '#111', fontWeight: '600' },
    editBtns: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    saveBtn: { backgroundColor: '#2563eb', padding: 10, borderRadius: 6 },
    saveBtnText: { color: '#fff', fontWeight: '600' },
    cancelBtn: { backgroundColor: '#f3f4f6', padding: 10, borderRadius: 6 },
    memberRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      backgroundColor: dark ? '#1f2937' : '#e5e7eb',
      padding: 10, borderRadius: 6, marginBottom: 6,
    },
    memberText: { color: dark ? '#fff' : '#111' },
    removeBtn: { color: 'red', fontWeight: 'bold' },
    addMemberBox: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    addBtn: { backgroundColor: '#22c55e', padding: 10, borderRadius: 6, marginLeft: 8 },
    addBtnText: { color: '#fff', fontWeight: 'bold' },
    channelBox: {
      backgroundColor: dark ? '#1e3a8a' : '#3b82f6',
      padding: 12,
      borderRadius: 6,
      marginBottom: 8,
    },
    channelText: {
      color: '#fff',
      fontWeight: '600',
    },
  });

export default WorkspaceDetailScreen;
