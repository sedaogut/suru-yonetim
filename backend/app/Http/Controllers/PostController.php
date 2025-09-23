<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\Request;

class PostController extends Controller
{
    public function index()
    {
        return Post::latest()->get();
    }

    public function store(Request $r)
    {
        $data = $r->validate([
            'title' => 'required|string|max:255',
            'body'  => 'nullable|string',
        ]);

        $post = Post::create($data);
        return $post;
    }

    public function show(Post $post)
    {
        return $post;
    }

    public function update(Request $r, Post $post)
    {
        $data = $r->validate([
            'title' => 'sometimes|string|max:255',
            'body'  => 'nullable|string',
        ]);

        $post->update($data);
        return $post->fresh(); // <-- değişiklikleri yenile
    }

    public function destroy(Post $post)
    {
        $post->delete();
        return response()->noContent();
    }
}
