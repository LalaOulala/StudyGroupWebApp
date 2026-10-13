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
} from "lucide-react";
import type { PageProps, Bootstrap } from "../types";
import { Avatar, Empty } from "../components/UI";
import { formatDate, formatMinutes } from "../api";

const milestones = [
  {
    name: "Le premier pas",
    xp: 0,
    icon: Compass,
    description: "L’équipe se rassemble.",
  },
  {
    name: "Le camp de base",
    xp: 60,
    icon: Tent,
    description: "Un point de départ pour vos prochaines aventures.",
  },
  {
    name: "La forêt des idées",
    xp: 160,
    icon: Trees,
    description: "De nouveaux chemins s’ouvrent à vous.",
  },
  {
    name: "Le col des possibles",
    xp: 300,
    icon: Mountain,
    description: "Prenez de la hauteur sur le chemin parcouru.",
  },
  {
    name: "La citadelle du savoir",
    xp: 500,
    icon: Castle,
    description: "Un refuge bâti par vos efforts communs.",
  },
];
export function Progress({ data, navigate, onCreate }: PageProps) {
  const history = data.sessions.filter((s) => s.reviewedAt);
  const stats = [
    { label: "Points d’aventure", value: data.stats.xp, icon: Trophy },
    { label: "Sessions accomplies", value: data.stats.sessions, icon: Compass },
    {
      label: "Temps engagé",
      value: formatMinutes(data.stats.minutes),
      icon: Clock3,
    },
    { label: "Objectifs terminés", value: data.stats.completed, icon: Check },
  ];
  return (
    <>
      <header className="page-heading">
        <h1>Le chemin parcouru.</h1>
        <p>Chaque petit pas mérite sa place dans votre histoire.</p>
      </header>
      <div className="stats-strip">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label}>
            <Icon size={21} />
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <section className="section-spacing">
        <h2>Votre carnet de voyage</h2>
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
                <span className="history-date">{formatDate(s.createdAt)}</span>
                <span className="history-title">
                  <strong>{s.title}</strong>
                  <small>
                    {s.room} · {formatMinutes(s.minutes ?? 0)}
                  </small>
                </span>
                <span className="xp-chip">+{s.earned ?? 0} pts</span>
                <ArrowRight size={17} />
              </button>
            ))}
          </div>
        )}
      </section>
      <section className="section-spacing">
        <h2>Vos compagnons de route</h2>
        <p className="muted">
          Les personnes avec qui vous avez terminé des sessions.
        </p>
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
          <p className="quiet-note">
            Après votre première session à plusieurs, vous les retrouverez ici.
          </p>
        )}
      </section>
    </>
  );
}
export function Expedition({ data }: { data: Bootstrap }) {
  const current = milestones.filter((m) => data.groupXp >= m.xp).at(-1)!;
  const next = milestones.find((m) => m.xp > data.groupXp);
  const percent = next
    ? Math.min(
        100,
        ((data.groupXp - current.xp) / (next.xp - current.xp)) * 100,
      )
    : 100;
  return (
    <>
      <header className="page-heading">
        <h1>Une aventure commune.</h1>
        <p>Vous avancez à votre rythme. L’expédition progresse ensemble.</p>
      </header>
      <div
        className="expedition-landscape"
        role="img"
        aria-label="Un camp d’aventuriers et un chemin vers une citadelle dans les montagnes"
      />
      <section className="expedition-status">
        <div>
          <span className="muted">Notre progression collective</span>
          <h2>
            {data.groupXp} <span>points d’aventure</span>
          </h2>
        </div>
        <div className="next-milestone">
          <span>
            {next
              ? `${Math.max(0, next.xp - data.groupXp)} points jusqu’à « ${next.name} »`
              : "La citadelle est atteinte. L’aventure continue !"}
          </span>
          <div
            className="progress-track"
            role="progressbar"
            aria-label="Prochaine étape"
            aria-valuenow={Math.round(percent)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div style={{ width: `${percent}%` }} />
          </div>
        </div>
      </section>
      <ol className="milestones">
        {milestones.map(({ name, xp, icon: Icon, description }) => {
          const unlocked = data.groupXp >= xp;
          return (
            <li className={unlocked ? "unlocked" : ""} key={name}>
              <span className="milestone-icon">
                <Icon size={26} />
              </span>
              <div>
                <h3>{name}</h3>
                <p>{description}</p>
              </div>
              <span className="milestone-state">
                {unlocked ? (
                  <>
                    <Check size={15} />
                    Atteint
                  </>
                ) : (
                  <>
                    <LockKeyhole size={14} />
                    {xp} pts
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ol>
      <details className="rules" open>
        <summary>Comment fait-on avancer l’expédition ?</summary>
        <p>
          Après au moins 5 minutes de session et un objectif posé, votre bilan
          rapporte 10 points. Vos avancées ajoutent jusqu’à 10 points : un
          objectif avancé compte à moitié, un objectif terminé en entier. Le
          bonus dépend de la moyenne, jamais du nombre de tâches.
        </p>
        <p>
          Les 3 premières sessions récompensées par jour (UTC) comptent. Une
          session plus courte reste dans votre carnet. Aucun point perdu, aucune
          obligation de tout terminer.
        </p>
        <p className="hint">
          Le temps engagé mesure votre participation déclarée sur le site. La
          présence Discord n’est pas encore synchronisée.
        </p>
      </details>
    </>
  );
}
