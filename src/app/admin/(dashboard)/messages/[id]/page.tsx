'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { adminMessagesApi } from '@/lib/admin-api';
import Link from 'next/link';

interface Message {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function AdminMessageDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const [message, setMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminMessagesApi.getOne(id)
      .then((res) => setMessage(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!message) {
    return <p className="text-center text-gray-500 py-20">الرسالة غير موجودة</p>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back */}
      <Link href="/admin/messages" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        العودة للرسائل
      </Link>

      <div className="bg-white rounded-xl border p-6 space-y-6">
        {/* Sender Info */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
            <span className="text-blue-600 font-bold text-lg">{message.name.charAt(0)}</span>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900">{message.name}</h2>
            <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
              <span>{message.email}</span>
              {message.phone && <span>|  {message.phone}</span>}
              {message.company && <span>|  {message.company}</span>}
            </div>
          </div>
          <span className="text-xs text-gray-400 shrink-0">
            {new Date(message.created_at).toLocaleString('ar-DZ')}
          </span>
        </div>

        {/* Message Content */}
        <div className="border-t pt-6">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{message.message}</p>
        </div>

        {/* Actions */}
        <div className="border-t pt-4 flex items-center gap-3">
          <a
            href={`mailto:${message.email}`}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            الرد عبر البريد
          </a>
          {message.phone && (
            <a
              href={`tel:${message.phone}`}
              className="px-4 py-2 text-sm font-medium bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
            >
              اتصال
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
