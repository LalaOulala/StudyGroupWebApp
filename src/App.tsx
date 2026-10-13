import { useCallback, useEffect, useRef, useState } from "react";
import { Gamepad2, UserRound, Map, Link, ChevronRight } from "lucide-react";
import { GameLogo } from "./components/GameUI";
import { playerProgress } from "./game";
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
    { name: "Le lobby", path: "/", icon: Gamepad2 },
    {
      name: "Mon joueur",
      path: "/progression",
      icon: UserRound,
    },
    { name: "La carte", path: "/expedition", icon: Map },
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
      <header className="app-header">
        <button
          className="brand"
          onClick={() => navigate("/")}
          aria-label="Study Group, accueil"
        >
          <GameLogo />
          <span>
            STUDY
            <br />
            GROUP
          </span>
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
            <Avatar user={{ name: "?", color: "sky" }} />
          )}
          <span>
            <strong>
              NIV.{" "}
              {String(playerProgress(data.stats.xp).level).padStart(2, "0")}
            </strong>
            <small>{data.user?.name ?? "Mon profil"}</small>
          </span>
          <ChevronRight size={17} />
        </button>
      </header>
      <main
        id="main"
        tabIndex={-1}
        className={`main-content ${sessionId ? "session-page" : ""}`}
      >
        <div className={`topbar ${path === "/" ? "lobby-topbar" : ""}`}>
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
          <Expedition data={data} onCreate={create} />
        ) : path === "/" ? (
          <Home
            data={data}
            navigate={navigate}
            onCreate={create}
            onJoin={() => setModal("join")}
          />
        ) : (
          <div className="fatal">
            <h1>Ce chemin reste à explorer.</h1>
            <button className="button primary" onClick={() => navigate("/")}>
              Retour aux sessions
            </button>
          </div>
        )}
        <footer>
          <span />
          Chacun son rythme. Même équipe.
          <span />
        </footer>
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
