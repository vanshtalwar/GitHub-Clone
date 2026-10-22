import { Component, type ErrorInfo, type ReactNode } from 'react';

/** Contains a render error (or a failed lazy import) to one section, showing `fallback` instead of breaking the page. */
export class ErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Section failed to render', error, info.componentStack);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
