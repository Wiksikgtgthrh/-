import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiService } from '../services/api';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'ok' | 'already' | 'err'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('err');
      setMessage('Неполная ссылка. Откройте ссылку из письма целиком.');
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const data = await apiService.verifyEmail(token);
        if (cancelled) return;
        setStatus('ok');
        setMessage(data.detail || 'Email подтверждён.');
      } catch (e) {
        if (cancelled) return;
        setStatus('err');
        setMessage(e instanceof Error ? e.message : 'Не удалось подтвердить email.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <div className="container mx-auto px-4 py-16 max-w-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Подтверждение email</h1>
      {status === 'loading' && <p className="text-gray-600">Проверяем ссылку…</p>}
      {(status === 'ok' || status === 'already' || status === 'err') && (
        <div
          className={`p-4 rounded-lg mb-6 ${
            status === 'err' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-900 border border-green-200'
          }`}
        >
          {message}
        </div>
      )}
      <Link to="/" className="text-red-600 hover:underline">
        На главную
      </Link>
    </div>
  );
}
