"use client";

import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  copied: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  pageName?: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, copied: false };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleCopy = () => {
    const { error, errorInfo } = this.state;
    const errorDetails = `
Error: ${error?.name || "Unknown Error"}
Message: ${error?.message || "No message"}
Stack: ${error?.stack || "No stack trace"}
Component Stack: ${errorInfo?.componentStack || "No component stack"}
Page: ${this.props.pageName || "Unknown"}
Time: ${new Date().toISOString()}
URL: ${typeof window !== "undefined" ? window.location.href : "N/A"}
User Agent: ${typeof navigator !== "undefined" ? navigator.userAgent : "N/A"}
    `.trim();

    navigator.clipboard.writeText(errorDetails);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, copied } = this.state;

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 space-y-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="rounded-full bg-destructive/10 p-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Something went wrong
              </h2>
              <p className="text-muted-foreground mt-1">
                {this.props.pageName
                  ? `An error occurred on the ${this.props.pageName} page`
                  : "An unexpected error occurred"}
              </p>
            </div>
          </div>

          <div className="w-full max-w-2xl rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-foreground">Error Details</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleCopy}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy Error
                  </>
                )}
              </Button>
            </div>
            
            <div className="space-y-2">
              <div className="rounded bg-muted p-3">
                <p className="text-xs font-medium text-muted-foreground">Error Name</p>
                <p className="text-sm font-mono text-destructive">{error?.name || "Unknown"}</p>
              </div>
              
              <div className="rounded bg-muted p-3">
                <p className="text-xs font-medium text-muted-foreground">Error Message</p>
                <p className="text-sm font-mono text-foreground break-all">
                  {error?.message || "No error message available"}
                </p>
              </div>

              {error?.stack && (
                <details className="rounded bg-muted p-3">
                  <summary className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground">
                    Stack Trace (click to expand)
                  </summary>
                  <pre className="mt-2 text-xs font-mono text-foreground whitespace-pre-wrap overflow-auto max-h-48">
                    {error.stack}
                  </pre>
                </details>
              )}

              {errorInfo?.componentStack && (
                <details className="rounded bg-muted p-3">
                  <summary className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground">
                    Component Stack (click to expand)
                  </summary>
                  <pre className="mt-2 text-xs font-mono text-foreground whitespace-pre-wrap overflow-auto max-h-48">
                    {errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={this.handleReset} variant="default" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
