import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const BlogPage: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.getBlogPosts().then(data => {
      setPosts(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center py-20">Загрузка...</div>;

  return (
    <div className="py-12 bg-white">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-8">Блог</h1>
        {posts.length === 0 ? (
          <p className="text-center text-gray-500">Скоро здесь появятся статьи</p>
        ) : (
          <div className="space-y-8">
            {posts.map(post => (
              <article key={post.id} className="border-b pb-6">
                <h2 className="text-2xl font-bold mb-2">{post.title}</h2>
                <p className="text-gray-500 text-sm mb-4">{new Date(post.date).toLocaleDateString()}</p>
                <p className="text-gray-700">{post.excerpt}</p>
                <a href={`/blog/${post.id}`} className="text-red-600 hover:underline mt-2 inline-block">
                  Читать далее
                </a>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPage;
