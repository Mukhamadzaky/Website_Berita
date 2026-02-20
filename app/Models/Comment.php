<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    use HasFactory;
    
    // Wajib ditambahkan agar bisa diisi
    protected $fillable = ['news_id', 'name', 'comment'];
}