<?php

use App\Http\Controllers\ApiController;
use Illuminate\Support\Facades\Route;

// ==========================================
// PUBLIC ROUTES (Bisa diakses tanpa login)
// ==========================================

// Autentikasi
Route::post('/register', [ApiController::class, 'register']);
Route::post('/login', [ApiController::class, 'login']);

// Menampilkan Data (Read Only)
Route::get('/news', [ApiController::class, 'getNews']);
Route::get('/documents', [ApiController::class, 'getDocuments']);

// Kirim Pesan (Dari halaman depan / index.html)
Route::post('/contact', [ApiController::class, 'storeMessage']); // <-- TAMBAHAN BARU


// ==========================================
// PROTECTED ROUTES (Harus Login Admin)
// ==========================================
Route::middleware('auth:sanctum')->group(function () {
    
    // Logout
    Route::post('/logout', [ApiController::class, 'logout']);

    // Upload & Input Data
    Route::post('/news', [ApiController::class, 'storeNews']);
    Route::post('/documents', [ApiController::class, 'storeDocument']);

    // Fitur Dashboard Admin (TAMBAHAN BARU)
    Route::get('/dashboard-stats', [ApiController::class, 'getDashboardStats']); // Statistik Widget
    Route::get('/users', [ApiController::class, 'getUsers']);                   // Daftar Admin
    Route::get('/inbox', [ApiController::class, 'getMessages']);                // Baca Pesan Masuk
});