import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/anton/latin-400.css";
import "@fontsource/bungee/latin-400.css";
import "@fontsource/vt323/latin-400.css";

import "./styles.css";
import { App } from "./App";
import { FeedbackProvider } from "./components/GameUI";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="fatal">
        <h1>Retrouvons notre chemin.</h1>
        <p>
          Un problème a interrompu l’affichage. Vos données enregistrées sont
          conservées.
        </p>
        <button className="button primary" onClick={() => location.reload()}>
          Recharger la page
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <FeedbackProvider>
        <App />
      </FeedbackProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
