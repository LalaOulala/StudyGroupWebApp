import { useState } from "react";
import { Play, ArrowRight, Users, Flag, Link, Plus } from "lucide-react";
import { Empty } from "../components/UI";
import { WindowBar, PlayerXP, WorldHUD, Mascot } from "../components/GameUI";
import { worldProgress } from "../game";
import { formatDate } from "../api";
import type { PageProps } from "../types";

export function Home({
  data,
  navigate,
  onCreate,
  onJoin,
}: PageProps & { onJoin: () => void }) {
  const [tab, setTab] = useState("active");
  const sessions = data.sessions.filter((s) => s.status === tab);
  const { currentIndex, next, current } = worldProgress(data.groupXp);
  return (
    <>
      <header className="lobby-heading">
        <div>
          <h1>
            On avance.
            <br />
            Ensemble.
          </h1>
          <p>Tes objectifs. Ton équipe. Une aventure commune.</p>
        </div>
        <PlayerXP xp={data.stats.xp} compact />
      </header>
      <section
        className="game-window world-window"
        aria-label="Créer ou rejoindre une session"
      >
        <WindowBar end={<span className="mono">CO-OP MODE</span>}>
          Study World
        </WindowBar>
        <div className="world-scene">
          <div className="quest-dialog">
            <span className="section-kicker">Ta prochaine quête</span>
            <h2>
              Un petit pas.
              <br />
              Un vrai départ.
            </h2>
            <p>Lance une session et avance avec ton équipe.</p>
            <button className="button primary start-button" onClick={onCreate}>
              <Play size={19} fill="currentColor" />
              Créer une session
            </button>
            <button className="text-link join-link" onClick={onJoin}>
              <Link size={16} />
              Rejoindre avec un lien
            </button>
          </div>
          <div className="world-label">
            <span>
              MONDE {String(Math.min(currentIndex + 1, 4)).padStart(2, "0")}
            </span>
            <strong>{next?.name ?? current.name}</strong>
          </div>
          <Mascot className="world-mascot" />
          <span className="scene-spark one" aria-hidden="true">
            ✦
          </span>
          <span className="scene-spark two" aria-hidden="true">
            ✦
          </span>
        </div>
        <WorldHUD xp={data.groupXp} onExplore={() => navigate("/expedition")} />
      </section>
      <section className="sessions-section">
        <div className="sessions-heading">
          <h2>Le tableau des sessions</h2>
          <div className="tabs" role="tablist" aria-label="Sessions">
            <button
              role="tab"
              aria-selected={tab === "active"}
              onClick={() => setTab("active")}
            >
              En cours{" "}
              {data.sessions.some((s) => s.status === "active") && (
                <span>
                  {data.sessions.filter((s) => s.status === "active").length}
                </span>
              )}
            </button>
            <button
              role="tab"
              aria-selected={tab === "ended"}
              onClick={() => setTab("ended")}
            >
              Terminées
            </button>
          </div>
        </div>
        <div className="session-list">
          {sessions.map((s) => (
            <article className={`session-row ${s.status}`} key={s.id}>
              <div className="session-cartridge" aria-hidden="true">
                {s.status === "active" ? (
                  <Play size={24} fill="currentColor" />
                ) : (
                  <Flag size={24} />
                )}
              </div>
              <div className="session-row-title">
                <h3>{s.title}</h3>
                <p>
                  <span className={`session-dot ${s.status}`} />
                  {s.room} <span>·</span> {s.duration} min{" "}
                  {s.status === "ended" && (
                    <>
                      {" "}
                      <span>·</span> {formatDate(s.createdAt)}
                    </>
                  )}
                </p>
              </div>
              <div className="row-members">
                <Users size={18} />
                <span>
                  {s.participantCount} joueur{s.participantCount > 1 ? "s" : ""}
                </span>
              </div>
              <button
                className={`button ${s.status === "active" ? "blue" : "outline"}`}
                onClick={() => navigate(`/sessions/${s.id}`)}
              >
                {s.status === "ended"
                  ? s.reviewedAt
                    ? "Voir le bilan"
                    : "Faire mon bilan"
                  : "Reprendre la session"}
                <ArrowRight size={18} />
              </button>
            </article>
          ))}
        </div>
        {sessions.length === 0 ? (
          <Empty onCreate={onCreate} ended={tab === "ended"} />
        ) : (
          <button className="new-session-row" onClick={onCreate}>
            <Plus size={20} />
            Créer une autre session
          </button>
        )}
      </section>
    </>
  );
}
