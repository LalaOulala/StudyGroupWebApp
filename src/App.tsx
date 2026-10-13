import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Map,
  Link,
  ChevronRight,
} from "lucide-react";
import { api, errorMessage } from "./api";
import type { Bootstrap } from "./types";
import { Avatar, Loading, ErrorNote } from "./components/UI";
import { CreateForm, JoinForm, ProfileForm } from "./components/Forms";
import { Home } from "./pages/Home";
import { Progress, Expedition } from "./pages/Progress";
import { Session } from "./pages/Session";

export function App() {
  const [path, setPath] = useState(location.pathname);
  const [data, setData] = useState<Bootstrap | null>(null);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<"profile" | "create" | "join" | null>(
    null,
  );
  const afterProfile = useRef<(() => void) | null>(null);
  const refresh = useCallback(async () => {
    try {
      setData(await api<Bootstrap>("/bootstrap"));
      setError("");
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);
  useEffect(() => {
    void refresh();
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    const interval = setInterval(onFocus, 15000);
    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(interval);
    };
  }, [refresh]);
  useEffect(() => {
    const onPop = () => setPath(location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  function navigate(next: string) {
    history.pushState({}, "", next);
    setPath(next);
    window.scrollTo({ top: 0, behavior: "instant" });
    void refresh();
  }
  function ensureProfile(action: () => void) {
    if (data?.user) action();
    else {
      afterProfile.current = action;
      setModal("profile");
    }
  }
  function create() {
    ensureProfile(() => setModal("create"));
  }
  const sessionId = path.match(/^\/sessions\/([\w-]{16})\/?$/)?.[1];
  const nav = [
    { name: "Sessions", path: "/", icon: CalendarDays },
    {
      name: "Ma progression",
      path: "/progression",
      icon: ChartNoAxesColumnIncreasing,
    },
    { name: "L’expédition", path: "/expedition", icon: Map },
  ];
  if (!data)
    return (
      <div className="initial-load">
        {error ? (
          <>
            <ErrorNote message={error} />
            <button className="button outline" onClick={() => void refresh()}>
              Réessayer
            </button>
          </>
        ) : (
          <Loading />
        )}
      </div>
    );
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Aller au contenu
      </a>
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => navigate("/")}
          aria-label="Study Group, accueil"
        >
          <BookOpen size={35} strokeWidth={1.5} />
          <span>Study Group</span>
        </button>
        <nav aria-label="Navigation principale">
          {nav.map(({ name, path: target, icon: Icon }) => (
            <button
              key={target}
              className={
                (target === "/" ? path === "/" || !!sessionId : path === target)
                  ? "active"
                  : ""
              }
              onClick={() => navigate(target)}
              aria-current={
                path === target || (target === "/" && sessionId)
                  ? "page"
                  : undefined
              }
            >
              <Icon size={22} strokeWidth={1.6} />
              <span>{name}</span>
            </button>
          ))}
        </nav>
        <button
          className="profile-nav"
          aria-label="Mon profil"
          onClick={() => {
            afterProfile.current = null;
            setModal("profile");
          }}
        >
          {data.user ? (
            <Avatar user={data.user} />
          ) : (
            <span className="avatar sage">?</span>
          )}
          <span>{data.user?.name ?? "Mon profil"}</span>
          <ChevronRight size={17} />
        </button>
      </aside>
      <main
        id="main"
        tabIndex={-1}
        className={`main-content ${sessionId ? "session-page" : ""}`}
      >
        <div className="topbar">
          <button className="text-link" onClick={() => setModal("join")}>
            <Link size={19} />
            Rejoindre avec un lien
          </button>
        </div>
        {error && <ErrorNote message={error} />}{" "}
        {sessionId ? (
          <Session
            key={sessionId}
            id={sessionId}
            user={data.user}
            navigate={navigate}
            ensureProfile={ensureProfile}
            onRefresh={refresh}
          />
        ) : path === "/progression" ? (
          <Progress data={data} navigate={navigate} onCreate={create} />
        ) : path === "/expedition" ? (
          <Expedition data={data} />
        ) : path === "/" ? (
          <Home data={data} navigate={navigate} onCreate={create} />
        ) : (
          <div className="fatal">
            <h1>Ce chemin reste à explorer.</h1>
            <button className="button primary" onClick={() => navigate("/")}>
              Retour aux sessions
            </button>
          </div>
        )}
        <footer>Chacun son rythme. Une aventure commune.</footer>
      </main>
      {modal === "profile" && (
        <ProfileForm
          user={data.user}
          onClose={() => {
            setModal(null);
            afterProfile.current = null;
          }}
          onDone={async () => {
            await refresh();
            setModal(null);
            const action = afterProfile.current;
            afterProfile.current = null;
            action?.();
          }}
        />
      )}
      {modal === "create" && (
        <CreateForm
          onClose={() => setModal(null)}
          onCreated={(id) => {
            setModal(null);
            navigate(`/sessions/${id}`);
          }}
        />
      )}
      {modal === "join" && (
        <JoinForm
          onClose={() => setModal(null)}
          onJoin={(id) => {
            setModal(null);
            navigate(`/sessions/${id}`);
          }}
        />
      )}
    </div>
  );
}
