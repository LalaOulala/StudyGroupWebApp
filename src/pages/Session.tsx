import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Share2,
  Clock3,
  Users,
  Flag,
  Check,
  Trash2,
  PenLine,
  WifiOff,
  CheckCircle2,
} from "lucide-react";
import { api, errorMessage } from "../api";
import { Avatar, ErrorNote, Loading, Modal } from "../components/UI";
import { ShareForm } from "../components/Forms";
import type {
  Participant,
  Session as SessionData,
  Task,
  TaskStatus,
  User,
} from "../types";

const statuses: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "À faire" },
  { value: "doing", label: "En cours" },
  { value: "advanced", label: "Bien avancé" },
  { value: "done", label: "Terminé" },
  { value: "blocked", label: "Je bloque" },
];
function Timer({
  endsAt,
  ended,
  offset,
}: {
  endsAt: number;
  ended: boolean;
  offset: number;
}) {
  const [time, setTime] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setTime(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const seconds = Math.max(0, Math.ceil((endsAt - (time + offset)) / 1000));
  const text = `${Math.floor(seconds / 3600) > 0 ? `${Math.floor(seconds / 3600)}:` : ""}${String(Math.floor(seconds / 60) % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return (
    <>
      <span className="timer-label">
        <Clock3 size={16} />
        {ended
          ? "Session terminée"
          : seconds === 0
            ? "Place au bilan"
            : "Temps restant"}
      </span>
      <strong
        className="timer-number"
        aria-label={
          ended
            ? "Session terminée"
            : `${Math.ceil(seconds / 60)} minutes restantes`
        }
      >
        {ended ? "00:00" : text}
      </strong>
    </>
  );
}
function TaskRow({
  task,
  editable,
  onUpdate,
  onDelete,
}: {
  task: Task;
  editable: boolean;
  onUpdate: (id: string, body: unknown) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [busy, setBusy] = useState(false);
  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  }
  return (
    <li className={`task-row status-${task.status}`}>
      <span className="task-status-icon">
        {task.status === "done" ? (
          <Check size={16} />
        ) : task.status === "blocked" ? (
          <Flag size={14} />
        ) : (
          <span />
        )}
      </span>
      {editing ? (
        <form
          className="task-edit"
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              if (await onUpdate(task.id, { title })) setEditing(false);
            });
          }}
        >
          <input
            aria-label="Nouveau titre de l’objectif"
            autoFocus
            required
            maxLength={160}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button
            className="icon-button"
            aria-label="Enregistrer le titre"
            disabled={busy}
          >
            <Check size={17} />
          </button>
        </form>
      ) : (
        <span className="task-title">{task.title}</span>
      )}
      {editable && !editing ? (
        <div className="task-controls">
          <select
            aria-label={`Avancement : ${task.title}`}
            value={task.status}
            disabled={busy}
            onChange={(e) =>
              void run(() => onUpdate(task.id, { status: e.target.value }))
            }
          >
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            className="icon-button"
            aria-label={`Modifier : ${task.title}`}
            onClick={() => {
              setTitle(task.title);
              setEditing(true);
            }}
            disabled={busy}
          >
            <PenLine size={15} />
          </button>
          <button
            className="icon-button delete"
            aria-label={`Supprimer : ${task.title}`}
            onClick={() => void run(() => onDelete(task.id))}
            disabled={busy}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ) : !editing ? (
        <span className={`status-label ${task.status}`}>
          {statuses.find((s) => s.value === task.status)?.label}
        </span>
      ) : null}
    </li>
  );
}
function ParticipantCard({
  participant,
  mine,
  owner,
  active,
  sessionId,
  onChange,
  onError,
}: {
  participant: Participant;
  mine: boolean;
  owner: boolean;
  active: boolean;
  sessionId: string;
  onChange: () => Promise<void>;
  onError: (message: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const reviewed = participant.reviewedAt !== null;
  async function mutate(path: string, body: unknown, method?: string) {
    try {
      await api(`/sessions/${sessionId}/tasks${path}`, body, method);
      await onChange();
      onError("");
      return true;
    } catch (e) {
      onError(errorMessage(e));
      return false;
    }
  }
  async function add(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`/sessions/${sessionId}/tasks`, { title });
      setTitle("");
      await onChange();
      onError("");
    } catch (e) {
      onError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  const done = participant.tasks.filter((t) => t.status === "done").length;
  return (
    <article className={`participant-card ${mine ? "mine" : ""}`}>
      <div className="participant-heading">
        <Avatar user={participant} />
        <div>
          <h3>
            {participant.name} {mine && <span>vous</span>}
          </h3>
          <p>
            {reviewed
              ? "Bilan partagé"
              : owner
                ? "Organisateur · En session"
                : "En session"}
          </p>
        </div>
        <span className="participant-count">
          {reviewed ? (
            <span className="xp-chip">+{participant.earned} pts</span>
          ) : (
            `${done}/${participant.tasks.length}`
          )}
        </span>
      </div>
      {participant.tasks.length ? (
        <ul className="task-list">
          {participant.tasks.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              editable={mine && !reviewed}
              onUpdate={(id, body) => mutate(`/${id}`, body, "PATCH")}
              onDelete={(id) => mutate(`/${id}`, {}, "DELETE")}
            />
          ))}
        </ul>
      ) : (
        <p className="no-goals">
          {mine
            ? "Quelle petite victoire visez-vous aujourd’hui ?"
            : "Prépare ses objectifs…"}
        </p>
      )}
      {mine && !reviewed && active && participant.tasks.length < 8 && (
        <form className="add-task" onSubmit={add}>
          <Plus size={18} />
          <input
            aria-label="Nouvel objectif"
            required
            maxLength={160}
            placeholder="Ajouter un objectif concret…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button className="text-button" disabled={busy || !title.trim()}>
            {busy ? "…" : "Ajouter"}
          </button>
        </form>
      )}
      {reviewed && (
        <div className="reflection">
          <CheckCircle2 size={17} />
          <div>
            <strong>Le petit bilan</strong>
            <p>
              {participant.reflection || "Une étape de plus dans l’aventure."}
            </p>
          </div>
        </div>
      )}
    </article>
  );
}

export function Session({
  id,
  user,
  navigate,
  ensureProfile,
  onRefresh,
}: {
  id: string;
  user: User | null;
  navigate: (path: string) => void;
  ensureProfile: (action: () => void) => void;
  onRefresh: () => Promise<void>;
}) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [error, setError] = useState("");
  const [fatal, setFatal] = useState("");
  const [connected, setConnected] = useState(true);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<"share" | "review" | "finish" | null>(
    null,
  );
  const [reflection, setReflection] = useState("");
  const [offset, setOffset] = useState(0);
  const load = useCallback(async () => {
    try {
      const s = await api<SessionData>(`/sessions/${id}`);
      setSession(s);
      setOffset(s.serverNow - Date.now());
      setFatal("");
    } catch (e) {
      setFatal(errorMessage(e));
    }
  }, [id]);
  useEffect(() => {
    setSession(null);
    void load();
  }, [load, user?.id]);
  useEffect(() => {
    if (!session || session.preview) return;
    const source = new EventSource(`/api/sessions/${id}/events`);
    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);
    source.addEventListener("changed", () => void load());
    return () => source.close();
  }, [id, session?.preview, load]);
  async function action(path: string, body: unknown = {}, after?: () => void) {
    setBusy(true);
    setError("");
    try {
      await api(`/sessions/${id}/${path}`, body);
      await load();
      await onRefresh();
      after?.();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  if (fatal && !session)
    return (
      <div className="invitation-error">
        <Flag size={32} />
        <h1>Un détour imprévu.</h1>
        <ErrorNote message={fatal} />
        <button className="button outline" onClick={() => void load()}>
          Réessayer
        </button>
        <button className="text-link" onClick={() => navigate("/")}>
          Retour aux sessions
          <ArrowRight size={17} />
        </button>
      </div>
    );
  if (!session) return <Loading />;
  if (session.preview)
    return (
      <div className="invitation">
        <div className="invitation-art" />
        <div className="invitation-content">
          <span className="invite-icon">
            <Users size={25} />
          </span>
          <h1>{session.title}</h1>
          <p className="muted">
            {session.room} · {session.duration} minutes ·{" "}
            {session.participantCount} participant
            {session.participantCount > 1 ? "s" : ""}
          </p>
          <p>
            Une place vous attend. Rejoignez l’équipe pour partager vos
            objectifs et avancer ensemble.
          </p>
          <ErrorNote message={error} />
          {session.status === "active" ? (
            <button
              className="button primary wide"
              disabled={busy}
              onClick={() => ensureProfile(() => void action("join"))}
            >
              {busy ? "Connexion…" : "Rejoindre la session"}
              <ArrowRight size={18} />
            </button>
          ) : (
            <p className="quiet-note">
              Cette session est terminée. Rendez-vous pour la prochaine
              aventure.
            </p>
          )}
          <button className="text-link" onClick={() => navigate("/")}>
            Retour aux sessions
          </button>
        </div>
      </div>
    );
  const participants = session.participants ?? [];
  const me = participants.find((p) => p.id === user?.id);
  const owner = user?.id === session.ownerId;
  const active = session.status === "active";
  const sorted = [...participants].sort(
    (a, b) => Number(b.id === user?.id) - Number(a.id === user?.id),
  );
  return (
    <>
      <button className="back-link" onClick={() => navigate("/")}>
        <ArrowLeft size={16} />
        Toutes les sessions
      </button>
      <header className="session-title">
        <div>
          <div className={`live-label ${active ? "" : "ended"}`}>
            <span />
            {active ? "Session en cours" : "Session terminée"}
          </div>
          <h1>{session.title}</h1>
          <p>
            {session.room}
            <span>·</span>
            {participants.length} participant
            {participants.length > 1 ? "s" : ""}
            <span>·</span>
            {session.duration} min
          </p>
        </div>
        <button className="button outline" onClick={() => setModal("share")}>
          <Share2 size={17} />
          Inviter le groupe
        </button>
      </header>
      {!connected && (
        <p className="connection-note" role="status">
          <WifiOff size={17} />
          Connexion interrompue. Reconnexion en cours ; les dernières données
          restent affichées.
        </p>
      )}
      <ErrorNote message={error || fatal} />
      {session.note && <p className="session-intention">« {session.note} »</p>}
      <div className="session-layout">
        <section>
          <div className="section-label">
            <h2>Les quêtes de l’équipe</h2>
            <span>Chacun son rythme</span>
          </div>
          {sorted.map((p) => (
            <ParticipantCard
              key={p.id}
              participant={p}
              mine={p.id === user?.id}
              owner={p.id === session.ownerId}
              active={active}
              sessionId={id}
              onChange={load}
              onError={setError}
            />
          ))}
        </section>
        <aside className="session-rail">
          <div className="timer-panel">
            <Timer endsAt={session.endsAt} ended={!active} offset={offset} />
            <p>
              {active
                ? "Un objectif à la fois. Vous êtes au bon endroit."
                : "Prenez un instant pour regarder le chemin parcouru."}
            </p>
            {owner && active && (
              <button
                className="text-link"
                disabled={busy}
                onClick={() => void action("extend", { minutes: 15 })}
              >
                <Plus size={16} />
                Ajouter 15 minutes
              </button>
            )}
          </div>
          {me?.reviewedAt === null ? (
            <div className="review-panel">
              <h3>Votre prochaine étape</h3>
              <p>
                {active
                  ? "Quand vous avez terminé, partagez votre avancée avec le groupe."
                  : "Mettez à jour vos objectifs, puis partagez votre bilan."}
              </p>
              <button
                className="button primary wide"
                onClick={() => setModal("review")}
              >
                <Flag size={17} />
                Faire mon bilan
              </button>
            </div>
          ) : (
            <div className="review-panel success">
              <CheckCircle2 size={25} />
              <h3>Une étape accomplie.</h3>
              <p>
                Votre bilan est enregistré.
                <br />
                <strong>+{me?.earned ?? 0} points</strong> pour l’expédition.
              </p>
              <button
                className="text-link"
                onClick={() => navigate("/progression")}
              >
                Voir ma progression
                <ArrowRight size={16} />
              </button>
            </div>
          )}
          <div className="rail-note">
            <Users size={18} />
            <p>
              Rejoignez <strong>{session.room}</strong> dans Discord. Le vocal
              et le site fonctionnent séparément pour le moment.
            </p>
          </div>
          {owner && active && (
            <button
              className="finish-link"
              disabled={busy}
              onClick={() => setModal("finish")}
            >
              Terminer pour tout le monde
            </button>
          )}
        </aside>
      </div>
      {modal === "share" && (
        <ShareForm id={id} onClose={() => setModal(null)} />
      )}{" "}
      {modal === "finish" && (
        <Modal title="Clore cette étape ?" onClose={() => setModal(null)}>
          <p className="modal-description">
            Le minuteur s’arrêtera pour tout le groupe. Chacun pourra encore
            mettre à jour ses objectifs et faire son bilan.
          </p>
          <ErrorNote message={error} />
          <div className="modal-actions">
            <button className="button outline" onClick={() => setModal(null)}>
              Continuer la session
            </button>
            <button
              className="button primary"
              disabled={busy}
              onClick={() => void action("finish", {}, () => setModal(null))}
            >
              Terminer la session
            </button>
          </div>
        </Modal>
      )}
      {modal === "review" && (
        <Modal title="Chaque pas compte." onClose={() => setModal(null)}>
          <p className="modal-description">
            Votre bilan termine votre participation. Les autres peuvent
            continuer à leur rythme.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void action("review", { reflection }, () => setModal(null));
            }}
          >
            <div className="review-summary">
              {me?.tasks.length ? (
                <>
                  <CheckCircle2 size={21} />
                  <span>
                    {me.tasks.filter((t) => t.status === "done").length}{" "}
                    objectif(s) terminé(s) sur {me.tasks.length}
                  </span>
                </>
              ) : (
                <p>Aucun objectif renseigné pour cette session.</p>
              )}
            </div>
            <label>
              Qu’avez-vous envie de retenir ?{" "}
              <span className="optional">facultatif</span>
              <textarea
                autoFocus
                rows={3}
                maxLength={500}
                placeholder="Ce qui a avancé, une difficulté, votre prochaine étape…"
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
              />
            </label>
            <p className="hint">
              Les objectifs seront figés après le bilan. Les points sont
              attribués après 5 minutes minimum et un objectif posé, jusqu’à 3
              sessions récompensées par jour.
            </p>
            <ErrorNote message={error} />
            <button className="button primary wide" disabled={busy}>
              {busy ? "Enregistrement…" : "Enregistrer mon bilan"}
              <Check size={18} />
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
