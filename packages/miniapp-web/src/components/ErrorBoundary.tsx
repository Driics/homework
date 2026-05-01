import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('UI error boundary caught', error, info);
  }

  override render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <h1 className="text-lg font-semibold">Something went wrong.</h1>
          <p className="mt-2 text-sm text-[var(--tg-hint-color,#999)]">
            Please close the Mini App and reopen it.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
