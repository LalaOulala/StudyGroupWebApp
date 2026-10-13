import { useState } from "react";
import { Plus, ArrowRight, Users, Flag } from "lucide-react";
import { Banner, Empty } from "../components/UI";
import { formatDate } from "../api";
import type { PageProps } from "../types";

export function Home({ data, navigate, onCreate }: PageProps) {
  const [tab, setTab] = useState("active");
  const sessions = data.sessions.filter((s) => s.status === tab);
  return (
    <>
      <header className="page-heading">
        <h1>Chaque quête commence ensemble.</h1>
        <p>Vos objectifs, votre équipe, une aventure commune.</p>
        <button className="button primary" onClick={onCreate}>
          <Plus size={21} />
          Créer une session
        </button>
      </header>
      <Banner xp={data.groupXp} onExplore={() => navigate("/expedition")} />
      <section className="sessions-section">
        <h2>Vos sessions</h2>
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
        <div className="session-list">
          {sessions.map((s) => (
            <article className="session-row" key={s.id}>
              <span className={`session-dot ${s.status}`} />
              <div className="session-row-title">
                <h3>{s.title}</h3>
                <p>
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
                <Users size={17} />
                <span>
                  {s.participantCount} participant
                  {s.participantCount > 1 ? "s" : ""}
                </span>
              </div>
              <button
                className="button outline"
                onClick={() => navigate(`/sessions/${s.id}`)}
              >
                {s.status === "ended"
                  ? s.reviewedAt
                    ? "Voir le bilan"
                    : "Faire mon bilan"
                  : "Ouvrir la session"}
                <ArrowRight size={18} />
              </button>
            </article>
          ))}
        </div>
        {sessions.length === 0 ? (
          <Empty onCreate={onCreate} ended={tab === "ended"} />
        ) : (
          <button className="new-session-row" onClick={onCreate}>
            <Flag size={21} />
            <span>Une autre quête à partager ?</span>
            <Plus size={19} />
          </button>
        )}
      </section>
    </>
  );
}
