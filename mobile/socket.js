// socket.js
import { io } from 'socket.io-client';

const socket = io('http://192.168.30.125:5050');

export default socket;