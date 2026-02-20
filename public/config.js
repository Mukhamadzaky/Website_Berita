// URL utama untuk API Laravel Anda
const API_URL = 'http://127.0.0.1:8000/api';

// URL utama untuk mengambil gambar/dokumen dari storage Laravel
const STORAGE_URL = 'http://127.0.0.1:8000/storage/';

// Mengambil token (kunci masuk) dari browser
function getToken() {
    return localStorage.getItem('token');
}

// Fungsi "Satpam" untuk melindungi halaman Admin
function checkAuth() {
    const token = getToken();
    
    // Jika tidak ada token (belum login), tendang ke halaman login
    if (!token) {
        alert("🔒 Akses Ditolak! Anda harus login sebagai Admin terlebih dahulu.");
        window.location.href = 'login.html';
    }
}