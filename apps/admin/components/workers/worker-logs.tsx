'use client'

import { useState } from 'react'
import { Search, Download } from 'lucide-react'

interface WorkerLogsProps {
  logs: Array<{
    id: string
    worker_name: string
    status: string
    message: string
    created_at: string
  }>
}

export function WorkerLogs({ logs }: WorkerLogsProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = log.worker_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.message.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus
    return matchesSearch && matchesStatus
  })

  function handleExport() {
    const csv = [
      ['Worker', 'Status', 'Message', 'Created At'],
      ...filteredLogs.map(log => [
        log.worker_name,
        log.status,
        log.message,
        new Date(log.created_at).toISOString()
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `worker-logs-${new Date().toISOString()}.csv`
    a.click()
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="success">Success</option>
          <option value="error">Error</option>
          <option value="warning">Warning</option>
        </select>
        <button
          onClick={handleExport}
          className="flex items-center space-x-2 rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
        >
          <Download className="h-4 w-4" />
          <span>Export</span>
        </button>
      </div>

      {/* Logs Table */}
      <div className="rounded-lg border border-gray-200 bg-white shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Worker
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {log.worker_name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        log.status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : log.status === 'error'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{log.message}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredLogs.length === 0 && (
          <div className="p-8 text-center text-gray-500">No logs found</div>
        )}
      </div>
    </div>
  )
}

