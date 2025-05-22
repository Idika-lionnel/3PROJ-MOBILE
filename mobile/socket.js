// socket.js
import { io } from 'socket.io-client';

const socket = io('http://192.168.0.42:5050'); 

export default socket;