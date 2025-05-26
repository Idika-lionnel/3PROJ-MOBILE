import { Platform } from 'react-native';

let host;

if (Platform.OS === 'android') {
  // Android Emulator utilise 10.0.2.2 pour accéder à localhost de ta machine
  host = '10.0.2.2';
} else if (Platform.OS === 'ios') {
  // iOS Simulator peut accéder directement à l’IP de ta machine locale
  host = '10.128.173.228'; // ✅ remplace par l’IP locale de ta machine
} else {
  host = 'localhost'; // Pour le web (facultatif)
}

export const API_URL = `http://${host}:5050`;