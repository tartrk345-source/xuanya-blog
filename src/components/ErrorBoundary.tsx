import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen bg-[#FEFAF9] dark:bg-[#0A0E1A] flex items-center justify-center px-6">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="text-4xl">💥</div>
            <h2 className="text-lg font-bold text-[#313131] dark:text-[#E2E8F0]">页面加载出错</h2>
            <p className="text-sm text-[#767693] dark:text-[#94A3B8] break-all">
              {this.state.error?.message || '未知错误'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-5 py-2 text-sm bg-[#DA583F] dark:bg-[#3B82F6] text-white rounded-lg hover:bg-[#C44A35] transition-colors"
            >
              重新加载
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
