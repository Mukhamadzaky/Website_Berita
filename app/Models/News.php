<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class News extends Model
{
    use HasFactory;

    // Baris ini WAJIB ADA agar data bisa disimpan
    protected $fillable = ['title', 'content', 'image_path'];
}