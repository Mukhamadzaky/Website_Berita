<?php

use App\Http\Controllers\ApiController;
use Illuminate\Support\Facades\Route;

// Public Routes
Route::post('/register', [ApiController::class, 'register']);
Route::post('/login', [ApiController::class, 'login']);
Route::get('/news', [ApiController::class, 'getNews']);
Route::get('/documents', [ApiController::class, 'getDocuments']);

// Protected Routes (Butuh Login)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/news', [ApiController::class, 'storeNews']);
    Route::post('/documents', [ApiController::class, 'storeDocument']);
    Route::post('/logout', [ApiController::class, 'logout']);
});