'use client';

import { useEffect, useState, useCallback } from 'react';
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

interface PaginatedResponse {
  data: Message[];
  current_page: number;
  last_page: number;
  total: number;
}

export default function AdminMessagesPage() {
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, per_page: 15 };
      if (filter !== '') params.is_read = filter;
      const res = await adminMessagesApi.getAll(params);
      setData(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleDelete = async (id: number) => {
    if (!confirm('هل تريد حذف هذه الرسالة؟')) return;
    try {
      await adminMessagesApi.delete(id);
      fetchMessages();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex gap-3">
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">كل الرسائل</option>
            <option value="0">غير مقروءة</option>
            <option value="1">مقروءة</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="spinner"></div>
          </div>
        ) : !data || data.data.length === 0 ? (
          <p className="text-center text-gray-500 py-20">لا يوجد رسائل</p>
        ) : (
          <>
            <div className="divide-y">
              {data.data.map((msg) => (
                <Link
                  key={msg.id}
                  href={`/admin/messages/${msg.id}`}
                  className={`block p-5 hover:bg-gray-50 transition-colors ${
                    !msg.is_read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {!msg.is_read && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        )}
                        <span className={`text-sm ${!msg.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {msg.name}
                        </span>
                        <span className="text-xs text-gray-400">&mdash; {msg.email}</span>
                        {msg.company && (
                          <span className="text-xs text-gray-400">({msg.company})</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">{msg.message}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-gray-400">
                        {new Date(msg.created_at).toLocaleDateString('ar-DZ')}
                      </span>
                      <button
                        onClick={(e) => { e.preventDefault(); handleDelete(msg.id); }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {data.last_page > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t">
                <p className="text-sm text-gray-500">إجمالي {data.total} رسالة</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    السابق
                  </button>
                  <span className="text-sm text-gray-600">
                    {data.current_page} / {data.last_page}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(data.last_page, p + 1))}
                    disabled={page === data.last_page}
                    className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
