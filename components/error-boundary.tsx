'use client'

import React from 'react'
import { Button } from "@/components/ui/button"

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <h2 className="text-xl font-semibold">حدث خطأ غير متوقع</h2>
          <Button 
            onClick={() => this.setState({ hasError: false })}
            variant="outline"
          >
            حاول مرة أخرى
          </Button>
        </div>
      )
    }

    return this.props.children
  }
} 