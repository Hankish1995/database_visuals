"use client";

import { Component, type ReactNode } from "react";

interface Props { onError: () => void; children: ReactNode }

/** If the WebGL scene throws, hand over to the 2D diagram instead of a blank stage. */
export class SceneErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
