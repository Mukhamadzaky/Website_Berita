<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\News;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ApiController extends Controller
{
    // --- AUTHENTICATION ---
    public function register(Request $request) {
        $request->validate([
            'name' => 'required',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6'
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password)
        ]);

        return response()->json(['message' => 'Register sukses', 'token' => $user->createToken('auth_token')->plainTextToken]);
    }

    public function login(Request $request) {
        $user = User::where('email', $request->email)->first();
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Login gagal'], 401);
        }
        return response()->json(['message' => 'Login sukses', 'token' => $user->createToken('auth_token')->plainTextToken]);
    }

    public function logout(Request $request) {
        $request->user('sanctum')->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
    }

    // --- NEWS (BERITA) ---
    public function getNews() {
        return response()->json(News::latest()->get());
    }

    public function storeNews(Request $request) {
    $request->validate([
        'title' => 'required', 
        'content' => 'required',
        'image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048' // Validasi gambar max 2MB
    ]);

    $data = [
        'title' => $request->title,
        'content' => $request->content,
    ];

    // Jika ada file gambar yang diupload
    if ($request->hasFile('image')) {
        $data['image_path'] = $request->file('image')->store('news_images', 'public');
    }

    News::create($data);
    return response()->json(['message' => 'Berita berhasil diterbitkan!']);
}

    // --- DOCUMENTS ---
    public function getDocuments() {
        return response()->json(Document::latest()->get());
    }

    public function storeDocument(Request $request) {
        $request->validate([
            'title' => 'required',
            'file' => 'required|mimes:pdf,doc,docx|max:10240' // Max 10MB
        ]);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $path = $file->store('documents', 'public'); // Simpan di storage/app/public/documents
            
            Document::create([
                'title' => $request->title,
                'file_path' => $path,
                'file_type' => $file->getClientOriginalExtension()
            ]);
            
            return response()->json(['message' => 'Dokumen terupload!']);
        }
        return response()->json(['message' => 'Gagal upload'], 400);
    }

    // --- FITUR TAMBAHAN ---

    // 1. Dashboard Stats (Untuk widget angka-angka)
    public function getDashboardStats() {
        return response()->json([
            'total_news' => News::count(),
            'total_docs' => Document::count(),
            'total_users' => User::count(),
            'total_messages' => \App\Models\Message::count()
        ]);
    }

    // 2. User Management
    public function getUsers() {
        return response()->json(User::latest()->get());
    }

    // 3. Message / Inbox System
    public function storeMessage(Request $request) {
        // Ini untuk Publik (Tanpa Login)
        $request->validate(['name'=>'required', 'email'=>'required', 'message'=>'required']);
        \App\Models\Message::create($request->all());
        return response()->json(['message' => 'Pesan terkirim!']);
    }

    public function getMessages() {
        // Ini untuk Admin (Butuh Login)
        return response()->json(\App\Models\Message::latest()->get());
    }
}