<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\News;
use App\Models\Document;
use App\Models\Agenda; // Pastikan Model Agenda sudah dibuat
use App\Models\Gallery; // Pastikan Model Gallery sudah dibuat
use App\Models\Message;
use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ApiController extends Controller
{
    // ==========================================
    // AUTHENTICATION (Login/Register/Logout)
    // ==========================================
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

        return response()->json([
            'message' => 'Register sukses', 
            'token' => $user->createToken('auth_token')->plainTextToken
        ]);
    }

    public function login(Request $request) {
        $user = User::where('email', $request->email)->first();
        
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Login gagal'], 401);
        }
        
        return response()->json([
            'message' => 'Login sukses', 
            'token' => $user->createToken('auth_token')->plainTextToken
        ]);
    }

    public function logout(Request $request) {
        $request->user('sanctum')->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
    }

    // ==========================================
    // NEWS (BERITA)
    // ==========================================
    public function getNews() {
        return response()->json(News::latest()->get());
    }

    public function showNews($id) {
        $news = News::find($id);
        if (!$news) return response()->json(['message' => 'Data not found'], 404);
        return response()->json($news);
    }

    public function storeNews(Request $request) {
        $request->validate([
            'title' => 'required', 
            'content' => 'required',
            'image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048'
        ]);

        $data = [
            'title' => $request->title,
            'content' => $request->content,
        ];

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('news_images', 'public');
        }

        News::create($data);
        return response()->json(['message' => 'Berita berhasil diterbitkan!']);
    }

    public function destroyNews($id) {
        $news = News::find($id);
        if (!$news) return response()->json(['message' => 'Data tidak ditemukan'], 404);

        if ($news->image_path) {
            Storage::disk('public')->delete($news->image_path);
        }

        $news->delete();
        return response()->json(['message' => 'Berita berhasil dihapus']);
    }

    // ==========================================
    // DOCUMENTS (DOKUMEN)
    // ==========================================
    public function getDocuments() {
        return response()->json(Document::latest()->get());
    }

    public function showDocument($id) {
        $doc = Document::find($id);
        if (!$doc) return response()->json(['message' => 'Data not found'], 404);
        return response()->json($doc);
    }

    public function storeDocument(Request $request) {
        $request->validate([
            'title' => 'required',
            'file' => 'required|mimes:pdf,doc,docx,xls,xlsx|max:10240' 
        ]);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $path = $file->store('documents', 'public');
            
            Document::create([
                'title' => $request->title,
                'file_path' => $path,
                'file_type' => $file->getClientOriginalExtension()
            ]);
            
            return response()->json(['message' => 'Dokumen terupload!']);
        }
        return response()->json(['message' => 'Gagal upload'], 400);
    }

    public function destroyDocument($id) {
        $doc = Document::find($id);
        if (!$doc) return response()->json(['message' => 'Data tidak ditemukan'], 404);

        if ($doc->file_path) {
            Storage::disk('public')->delete($doc->file_path);
        }

        $doc->delete();
        return response()->json(['message' => 'Dokumen berhasil dihapus']);
    }

    // ==========================================
    // AGENDA (KEGIATAN / EVENT) - [BARU]
    // ==========================================
    public function getAgendas() {
        // Mengambil agenda dan mengurutkannya berdasarkan tanggal event terdekat
        return response()->json(Agenda::orderBy('event_date', 'asc')->get());
    }

    public function storeAgenda(Request $request) {
        $request->validate([
            'title' => 'required',
            'description' => 'required',
            'event_date' => 'required|date',
            'location' => 'required',
            'status' => 'nullable|in:upcoming,ongoing,finished'
        ]);

        Agenda::create([
            'title' => $request->title,
            'description' => $request->description,
            'event_date' => $request->event_date,
            'location' => $request->location,
            'status' => $request->status ?? 'upcoming'
        ]);

        return response()->json(['message' => 'Agenda berhasil ditambahkan!']);
    }

    public function destroyAgenda($id) {
        $agenda = Agenda::find($id);
        if (!$agenda) return response()->json(['message' => 'Agenda tidak ditemukan'], 404);
        
        $agenda->delete();
        return response()->json(['message' => 'Agenda berhasil dihapus']);
    }

    // ==========================================
    // GALLERY (DOKUMENTASI FOTO) - [BARU]
    // ==========================================
    public function getGalleries(Request $request) {
        $query = Gallery::query();

        // Jika ada filter kategori di request
        if ($request->has('category') && $request->category !== 'Semua') {
            $query->where('category', $request->category);
        }

        return response()->json($query->latest()->get());
    }

    public function storeGallery(Request $request) {
        $request->validate([
            'title' => 'required',
            'category' => 'required',
            'image' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120' // Max 5MB
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('gallery_images', 'public');
            
            Gallery::create([
                'title' => $request->title,
                'category' => $request->category,
                'image_path' => $path
            ]);
            
            return response()->json(['message' => 'Foto berhasil diunggah ke galeri!']);
        }
        return response()->json(['message' => 'Gagal upload foto'], 400);
    }

    public function destroyGallery($id) {
        $gallery = Gallery::find($id);
        if (!$gallery) return response()->json(['message' => 'Foto tidak ditemukan'], 404);

        if ($gallery->image_path) {
            Storage::disk('public')->delete($gallery->image_path);
        }

        $gallery->delete();
        return response()->json(['message' => 'Foto berhasil dihapus']);
    }

    // ==========================================
    // FITUR TAMBAHAN (Dashboard & Inbox)
    // ==========================================

    public function getDashboardStats() {
        return response()->json([
            'total_news' => News::count(),
            'total_docs' => Document::count(),
            'total_users' => User::count(),
            'total_messages' => Message::count(),
            'unread_messages' => Message::where('is_read', false)->count() 
        ]);
    }

    public function profile(Request $request) {
        return response()->json($request->user());
    }

    public function getUsers() {
        return response()->json(User::latest()->get());
    }

    public function getComments($newsId) {
        $comments = Comment::where('news_id', $newsId)->latest()->get();
        return response()->json($comments);
    }

    public function storeComment(Request $request, $newsId) {
        $request->validate([
            'name' => 'required',
            'comment' => 'required'
        ]);

        Comment::create([
            'news_id' => $newsId,
            'name' => $request->name,
            'comment' => $request->comment
        ]);

        return response()->json(['message' => 'Komentar berhasil ditambahkan!']);
    }

    public function storeMessage(Request $request) {
        $request->validate(['name'=>'required', 'email'=>'required', 'message'=>'required']);
        Message::create($request->all());
        return response()->json(['message' => 'Pesan terkirim!']);
    }

    public function getMessages() {
        $messages = Message::latest()->get();
        Message::where('is_read', false)->update(['is_read' => true]);
        
        return response()->json($messages);
    }
}