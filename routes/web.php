<?php

use Illuminate\Support\Facades\Route;

// Jika user mengakses http://127.0.0.1:8000/
// Langsung arahkan (redirect) ke halaman index.html
Route::get('/', function () {
    return redirect('/index.html');
});