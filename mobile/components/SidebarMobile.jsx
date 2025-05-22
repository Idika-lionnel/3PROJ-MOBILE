// components/SidebarMobile.js
import React, { useContext } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { AuthContext } from '../context/AuthContext';

const SidebarMobile = () => {
  const navigation = useNavigation();
  const { logout } = useContext(AuthContext);

  return (
    <View style={styles.sidebar}>
      {/* Profil */}
      <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.button}>
        <Icon name="person-circle-outline" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Dashboard */}
      <TouchableOpacity onPress={() => navigation.navigate('Dashboard')} style={styles.button}>
        <Icon name="home-outline" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Workspaces */}
      <TouchableOpacity onPress={() => navigation.navigate('Workspaces')} style={styles.button}>
        <Icon name="grid-outline" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Messages */}
      <TouchableOpacity onPress={() => navigation.navigate('ChatHome')} style={styles.button}>
        <Icon name="chatbubble-ellipses-outline" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity onPress={logout} style={styles.button}>
        <Icon name="log-out-outline" size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 60,
    backgroundColor: '#2563eb',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 30,
  },
  button: {
    marginVertical: 15,
  },
});

export default SidebarMobile;