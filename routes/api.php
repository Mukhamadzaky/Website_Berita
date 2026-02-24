<?php

use App\Http\Controllers\ApiController;
use Illuminate\Support\Facades\Route;

// ==========================================
// PUBLIC ROUTES (Bisa diakses tanpa login)
// ==========================================

// Autentikasi
Route::post('/register', [ApiController::class, 'register']);
Route::post('/login', [ApiController::class, 'login']);

// --- BERITA ---
Route::get('/news', [ApiController::class, 'getNews']);               // Ambil SEMUA berita
Route::get('/news/{id}', [ApiController::class, 'showNews']);         // <--- TAMBAHAN PENTING (Untuk Detail Berita)
Route::get('/news/{id}/comments', [ApiController::class, 'getComments']);
Route::post('/news/{id}/comments', [ApiController::class, 'storeComment']);

// --- DOKUMEN ---
Route::get('/documents', [ApiController::class, 'getDocuments']);     // Ambil SEMUA dokumen
Route::get('/documents/{id}', [ApiController::class, 'showDocument']);// <--- TAMBAHAN PENTING (Untuk Detail Dokumen)

// Kirim Pesan (Dari halaman depan / index.html)
Route::post('/contact', [ApiController::class, 'storeMessage']);


// ==========================================
// PROTECTED ROUTES (Harus Login Admin)
// ==========================================
Route::middleware('auth:sanctum')->group(function () {
    
    // Logout
    Route::post('/logout', [ApiController::class, 'logout']);

    // Upload & Input Data
    Route::post('/news', [ApiController::class, 'storeNews']);
    Route::post('/documents', [ApiController::class, 'storeDocument']);

    // Route Hapus (TAMBAHAN BARU)
    Route::delete('/news/{id}', [ApiController::class, 'destroyNews']);
    Route::delete('/documents/{id}', [ApiController::class, 'destroyDocument']);

    // Fitur Dashboard Admin
    Route::get('/dashboard-stats', [ApiController::class, 'getDashboardStats']); 
    Route::get('/users', [ApiController::class, 'getUsers']);                   
    Route::get('/inbox', [ApiController::class, 'getMessages']);  
    // Tambahkan baris ini di dalam sini:
    Route::get('/profile', [ApiController::class, 'profile']);     
    
    Route::get('/agendas', [ApiController::class, 'getAgendas']);
Route::post('/agendas', [ApiController::class, 'storeAgenda']);
Route::delete('/agendas/{id}', [ApiController::class, 'destroyAgenda']);

Route::get('/galleries', [ApiController::class, 'getGalleries']);
Route::post('/galleries', [ApiController::class, 'storeGallery']);
Route::delete('/galleries/{id}', [ApiController::class, 'destroyGallery']);
});