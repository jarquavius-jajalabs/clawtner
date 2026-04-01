import { Component } from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100dvh',
          padding: 32,
          textAlign: 'center',
          background: '#F7F8FA',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😵</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#1a1a2e' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
            The app hit an unexpected error.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 32px',
              borderRadius: 12,
              border: 'none',
              background: '#4F6AE8',
              color: 'white',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Tap to reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
