import React, { Component } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[GaadiDesk Crash Caught by ErrorBoundary]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetState = () => {
    try {
      localStorage.removeItem('gd_active_tab');
      window.location.href = '/';
    } catch {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FBF8F2] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 border-2 border-[#E5DFD3] shadow-xl text-center space-y-4 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-300 text-amber-900 mx-auto flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-amber-700" />
            </div>

            <div>
              <h2 className="text-base font-black text-[#111827]">
                Something went wrong
              </h2>
              <p className="text-xs text-[#4B5563] font-semibold mt-1">
                GaadiDesk encountered an unexpected error. Don't worry, your offline records and database transactions are safe.
              </p>
            </div>

            {/* Error Message Details (collapsible) */}
            {this.state.error && (
              <div className="p-3 bg-[#F8F6F0] rounded-2xl border border-[#E5DFD3] text-left">
                <p className="text-[10px] font-mono font-bold text-red-700 break-words">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full py-3 rounded-full bg-[#111827] hover:bg-black text-white text-xs font-black flex items-center justify-center gap-2 tap-active shadow-md transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload GaadiDesk</span>
              </button>

              <button
                onClick={this.handleResetState}
                className="w-full py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-[#4B5563] text-xs font-bold tap-active transition"
              >
                Return to Home Screen
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
