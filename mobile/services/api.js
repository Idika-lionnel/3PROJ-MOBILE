import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.0.42:5050/api',  // ← c’est bon maintenant
});

export default api;