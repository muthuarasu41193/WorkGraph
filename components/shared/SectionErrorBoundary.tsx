"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  sectionName: string;
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export default class SectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[section-error:${this.props.sectionName}]`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="rounded-xl border border-[#DADCE0] bg-white p-6">
          <h2 className="text-base font-semibold text-[#1D1D1F]">Something went wrong</h2>
          <p className="mt-1 text-sm text-[#8E8E93]">
            We could not render {this.props.sectionName}. Refresh the page to try again.
          </p>
        </section>
      );
    }
    return this.props.children;
  }
}
