'use client'

import { CheckCircle, XCircle, Clock } from 'lucide-react'

interface WorkerStatusProps {
  name: string
  lastRun: string | null
  status: 'healthy' | 'warning' | 'error'
}

export function WorkerStatus({ name, lastRun, status }: WorkerStatusProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warning':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'healthy':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'error':
        return 'text-red-600'
    }
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center space-x-3">
        {getStatusIcon()}
        <div>
          <p className="font-medium text-gray-900">{name}</p>
          {lastRun && (
            <p className="text-sm text-gray-500">
              Last run: {new Date(lastRun).toLocaleString()}
            </p>
          )}
        </div>
      </div>
      <span className={`text-sm font-medium ${getStatusColor()}`}>
        {status.toUpperCase()}
      </span>
    </div>
  )
}

