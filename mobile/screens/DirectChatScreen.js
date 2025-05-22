import React, { useContext } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ThemeContext } from '../context/ThemeContext';
import DirectChatBox from '../components/DirectChatBox';

const DirectChatScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { dark } = useContext(ThemeContext);
  const { receiver, currentUserId } = route.params;

  const styles = createStyles(dark);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{receiver.prenom} {receiver.nom}</Text>
      </View>
      <DirectChatBox receiver={receiver} contacts={[]} currentUserId={currentUserId} />
    </View>
  );
};

const createStyles = (dark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dark ? '#111827' : '#fff',
  },
  header: {
    padding: 10,
    backgroundColor: dark ? '#1f2937' : '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  back: {
    fontSize: 18,
    color: dark ? '#fff' : '#000',
  },
  title: {
    fontWeight: 'bold',
    color: dark ? '#fff' : '#111827',
  },
});

export default DirectChatScreen;
