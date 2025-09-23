<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\Request;

class PostController extends Controller
{
    public function index()
    {
        return \App\Models\Post::latest()->get();
    }

    public function store(\Illuminate\Http\Request $r)
    {
        return \App\Models\Post::create($r->validate([
            'title' => 'required|string|max:255',
            'body' => 'nullable|string'
        ]));
    }

    public function show(\App\Models\Post $post)
    {
        return $post;
    }

    public function update(\Illuminate\Http\Request $r, \App\Models\Post $post)
    {
        $post->update($r->validate([
            'title' => 'sometimes|string|max:255',
            'body' => 'nullable|string'
        ]));
        return $post;
    }

    public function destroy(\App\Models\Post $post)
    {
        $post->delete();
        return response()->noContent();
    }
}
