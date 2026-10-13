import { useState } from "react";
import {
  Trophy,
  Check,
  Clock3,
  Compass,
  ArrowRight,
  Tent,
  Trees,
  Castle,
  Mountain,
  LockKeyhole,
  Flag,
  Users,
  BookOpen,
  Sparkles,
  Play,
} from "lucide-react";
import type { PageProps, Bootstrap } from "../types";
import { Avatar, Empty } from "../components/UI";
import { WindowBar, PlayerXP, WorldHUD, Mascot } from "../components/GameUI";
import { worlds, worldProgress, playerProgress } from "../game";
import { formatDate, formatMinutes } from "../api";
const icons = [Compass, Tent, Trees, Mountain, Castle];

export function Progress({ data, navigate, onCreate }: PageProps) {
  const history = data.sessions.filter((s) => s.reviewedAt);
  const stats = [
    { label: "XP gagnés", value: data.stats.xp, icon: Trophy },
    { label: "Sessions accomplies", value: data.stats.sessions, icon: Flag },
    {
      label: "Temps engagé",
      value: formatMinutes(data.stats.minutes),
      icon: Clock3,
    },
    { label: "Quêtes terminées", value: data.stats.completed, icon: Check },
  ];
  const badges = [
    {
      name: "Premier départ",
      rule: "Faire son premier bilan",
      unlocked: data.stats.sessions > 0,
      icon: Flag,
    },
    {
      name: "Mission accomplie",
      rule: "Terminer un objectif et faire son bilan",
      unlocked: data.stats.completed > 0,
      icon: Check,
    },
    {
      name: "Esprit d’équipe",
      rule: "Partager un bilan avec un coéquipier",
      unlocked: data.companions.length > 0,
      icon: Users,
    },
    {
      name: "Camp de base",
      rule: "Atteindre 60 XP ensemble",
      unlocked: data.groupXp >= 60,
      icon: Tent,
    },
  ];
  return (
    <>
      <header className="page-heading">
        <h1>
          Ton aventure
          <br />
          <span>prend forme.</span>
        </h1>
        <p>Pas de classement. Juste le chemin que tu as parcouru.</p>
      </header>
      <section className="player-card game-window">
        <WindowBar end={<span className="mono">SAUVEGARDE AUTO</span>}>
          Fiche de joueur
        </WindowBar>
        <div className="player-card-body">
          <div className="player-portrait">
            <Mascot />
            <span className="level-plate">
              NIV.{" "}
              {String(playerProgress(data.stats.xp).level).padStart(2, "0")}
            </span>
          </div>
          <div className="player-details">
            <span className="section-kicker">Compagnon de quête</span>
            <h2>{data.user?.name ?? "Ton aventure t’attend"}</h2>
            <PlayerXP xp={data.stats.xp} />
          </div>
          <div className="stats-strip">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label}>
                <Icon size={20} />
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section-spacing">
        <div className="section-title">
          <h2>Petites victoires, vrais souvenirs.</h2>
          <span className="mono">
            {badges.filter((b) => b.unlocked).length} / {badges.length} INSIGNES
          </span>
        </div>
        <div className="badge-collection">
          {badges.map(({ name, rule, unlocked, icon: Icon }) => (
            <div
              className={`achievement ${unlocked ? "unlocked" : ""}`}
              key={name}
            >
              <span className="achievement-icon">
                <Icon size={28} />
              </span>
              <div>
                <h3>{name}</h3>
                <p>{rule}</p>
                <span className="achievement-state">
                  {unlocked ? (
                    <>
                      <Check size={12} />
                      Débloqué
                    </>
                  ) : (
                    <>
                      <LockKeyhole size={12} />À découvrir
                    </>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
      <div className="journal-layout">
        <section className="section-spacing">
          <h2>Ton carnet de quêtes</h2>
          {history.length === 0 ? (
            <Empty onCreate={onCreate} ended />
          ) : (
            <div className="history-list">
              {history.map((s) => (
                <button
                  className="history-row"
                  key={s.id}
                  onClick={() => navigate(`/sessions/${s.id}`)}
                >
                  <span className="history-date">
                    {formatDate(s.createdAt)}
                  </span>
                  <span className="history-title">
                    <strong>{s.title}</strong>
                    <small>
                      {s.room} · {formatMinutes(s.minutes ?? 0)}
                    </small>
                  </span>
                  <span className="xp-chip">+{s.earned ?? 0} XP</span>
                  <ArrowRight size={17} />
                </button>
              ))}
            </div>
          )}
        </section>
        <section className="section-spacing companions-section">
          <h2>Tes coéquipiers</h2>
          <p className="muted">Les aventures se partagent.</p>
          {data.companions.length ? (
            <div className="companions">
              {data.companions.map((p) => (
                <div key={p.id}>
                  <Avatar user={p} />
                  <div>
                    <strong>{p.name}</strong>
                    <p>
                      {p.sessions} session{p.sessions > 1 ? "s" : ""} ensemble
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="quiet-note">
              <Users size={30} />
              <p>
                Après une session à plusieurs et vos bilans, retrouve ton équipe
                ici.
              </p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
export function Expedition({
  data,
  onCreate,
}: {
  data: Bootstrap;
  onCreate: () => void;
}) {
  const { currentIndex } = worldProgress(data.groupXp);
  const [selection, setSelection] = useState<number | null>(null);
  const selected = selection ?? currentIndex;
  const place = worlds[selected];
  const Icon = icons[selected];
  const unlocked = data.groupXp >= place.xp;
  return (
    <>
      <header className="page-heading map-heading">
        <div>
          <h1>
            Un monde à<br />
            <span>débloquer ensemble.</span>
          </h1>
          <p>Chaque bilan ajoute un petit bout à votre grande aventure.</p>
        </div>
        <div className="team-total">
          <Users size={23} />
          <strong>
            {data.groupXp}
            <small>XP COLLECTIFS</small>
          </strong>
        </div>
      </header>
      <section className="game-window map-window">
        <WindowBar
          end={<span className="mono">{currentIndex + 1} / 5 ÉTAPES</span>}
        >
          La carte de l’équipe
        </WindowBar>
        <div className="map-canvas">
          <svg
            className="map-route"
            viewBox="0 0 1000 400"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M90 300 Q170 360 270 228 T470 268 T640 176 T800 96" />
          </svg>
          {worlds.map((world, i) => (
            <button
              key={world.name}
              className={`map-node ${data.groupXp >= world.xp ? "unlocked" : "locked"} ${selected === i ? "selected" : ""}`}
              style={{ left: `${world.x}%`, top: `${world.y}%` }}
              aria-label={`${world.name}, ${data.groupXp >= world.xp ? "débloqué" : `${world.xp} XP requis`}`}
              aria-pressed={selected === i}
              onClick={() => setSelection(i)}
            >
              <span>
                {data.groupXp >= world.xp ? (
                  <Flag size={21} />
                ) : (
                  <LockKeyhole size={18} />
                )}
              </span>
              <b>{String(i + 1).padStart(2, "0")}</b>
            </button>
          ))}
          <span className="map-compass" aria-hidden="true">
            <Compass size={29} />
          </span>
        </div>
        <WorldHUD xp={data.groupXp} />
      </section>
      <section
        className={`map-detail ${unlocked ? "unlocked" : ""}`}
        aria-live="polite"
      >
        <div className="map-detail-icon">
          <Icon size={36} />
        </div>
        <div>
          <span className="section-kicker">
            Étape {String(selected + 1).padStart(2, "0")} ·{" "}
            {unlocked ? "Débloquée" : "À explorer"}
          </span>
          <h2>{place.name}</h2>
          <p>{place.description}</p>
        </div>
        <div className="map-detail-action">
          {unlocked ? (
            <span className="unlocked-stamp">
              <Check size={18} />
              Territoire découvert
            </span>
          ) : (
            <strong>
              {place.xp - data.groupXp} XP <span>avant cette étape</span>
            </strong>
          )}
          <button className="button primary" onClick={onCreate}>
            <Play size={16} fill="currentColor" />
            Créer une session
          </button>
        </div>
      </section>
      <ol className="world-index">
        {worlds.map((world, i) => (
          <li key={world.name}>
            <button
              onClick={() => setSelection(i)}
              className={`${selected === i ? "selected" : ""} ${data.groupXp >= world.xp ? "unlocked" : ""}`}
              aria-pressed={selected === i}
            >
              <span className="mono">{String(i + 1).padStart(2, "0")}</span>
              <strong>{world.name}</strong>
              <small>
                {data.groupXp >= world.xp ? (
                  <>
                    <Check size={13} />
                    Débloqué
                  </>
                ) : (
                  `${world.xp} XP`
                )}
              </small>
            </button>
          </li>
        ))}
      </ol>
      <details className="rules">
        <summary>
          <BookOpen size={19} />
          Les règles du jeu
        </summary>
        <div>
          <p>
            Les XP sont les points du groupe. Après au moins 5 minutes et un
            objectif posé, ton bilan rapporte 10 XP de participation, plus
            jusqu’à 10 XP d’avancement : terminé = 100 %, bien avancé = 50 %. Le
            bonus dépend de la moyenne, jamais du nombre de tâches.
          </p>
          <p>
            Les 3 premières sessions récompensées par jour (UTC) comptent.
            Chaque tranche de 100 XP personnels ouvre un niveau. Les étapes de
            la carte utilisent le total de toute l’équipe.
          </p>
          <p>
            Aucun point perdu, aucune série à maintenir. Le temps mesure la
            participation déclarée sur le site ; le vocal Discord reste
            indépendant.
          </p>
        </div>
      </details>
      <p className="map-motto">
        <Sparkles size={17} />
        Personne ne porte l’aventure tout seul.
      </p>
    </>
  );
}
