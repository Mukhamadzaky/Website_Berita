// config.js
const API_URL = '/api';
const STORAGE_URL = '/storage/';

function getToken() {
    return localStorage.getItem('token');
}

function checkAuth() {
    if (!getToken()) window.location.href = 'login.html';
}