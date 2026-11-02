import { Component, type ReactNode } from "react";
export class LazyPanelBoundary extends Component<
  { children: ReactNode; message: string },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? (
      <p role="alert">{this.props.message}</p>
    ) : (
      this.props.children
    );
  }
}
