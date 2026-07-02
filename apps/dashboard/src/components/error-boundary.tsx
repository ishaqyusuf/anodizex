"use client";

import React, { Component, type ReactNode } from "react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 border rounded-md border-destructive/50 bg-destructive/10 text-destructive text-sm">
          Something went wrong while loading this component.
        </div>
      );
    }

    return this.props.children;
  }
}
