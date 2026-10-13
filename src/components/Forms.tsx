import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Copy, Compass } from "lucide-react";
import { api, errorMessage } from "../api";
import type { Color, User, Session } from "../types";
import { Modal, ErrorNote, Avatar } from "./UI";

export function ProfileForm({
  user,
  onClose,
  onDone,
}: {
  user: User | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState(user?.name ?? "");
  const [color, setColor] = useState<Color>(user?.color ?? "sage");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/profile", { name, color });
      onDone();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={user ? "Ton profil" : "Nouveau joueur"} onClose={onClose}>
      <p className="modal-description">
        {user
          ? "Ton pseudo et ta couleur dans l’équipe."
          : "Choisis le pseudo que ton groupe reconnaîtra."}
      </p>
      <form onSubmit={submit}>
        <div className="profile-preview">
          <Avatar user={{ name: name || "?", color }} />
          <span>{name || "Ton pseudo"}</span>
        </div>
        <label>
          Ton pseudo
          <input
            autoFocus
            required
            maxLength={32}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Par exemple : Lala"
            autoComplete="nickname"
          />
        </label>
        <fieldset className="colors">
          <legend>Ta couleur</legend>
          {(["sage", "clay", "sky", "lavender", "gold"] as Color[]).map(
            (c, i) => (
              <button
                key={c}
                className={`color-choice ${c}`}
                type="button"
                aria-label={
                  ["Vert sauge", "Terre cuite", "Bleu ciel", "Lavande", "Or"][i]
                }
                aria-pressed={c === color}
                onClick={() => setColor(c)}
              >
                {c === color && <Check size={18} />}
              </button>
            ),
          )}
        </fieldset>
        <p className="hint">
          Profil invité conservé dans ce navigateur. Garde ses données pour
          retrouver tes XP. La connexion Discord arrivera plus tard.
        </p>
        <ErrorNote message={error} />
        <button className="button primary wide" disabled={busy || !name.trim()}>
          {busy
            ? "Enregistrement…"
            : user
              ? "Enregistrer"
              : "Commencer l’aventure"}
          <ArrowRight size={18} />
        </button>
      </form>
    </Modal>
  );
}
export function CreateForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(60);
  const [room, setRoom] = useState("Study Room 1");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const s = await api<Session>("/sessions", {
        title,
        room,
        duration,
        note,
      });
      onCreated(s.id);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Une nouvelle quête." onClose={onClose}>
      <p className="modal-description">
        Fixe le rendez-vous. Chacun apporte ses propres quêtes.
      </p>
      <form onSubmit={submit}>
        <label>
          Nom de la session
          <input
            autoFocus
            required
            maxLength={80}
            placeholder="Une heure pour avancer"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <div className="form-columns">
          <label>
            Salon vocal
            <select value={room} onChange={(e) => setRoom(e.target.value)}>
              <option>Study Room 1</option>
              <option>Study Room 2</option>
              <option>Autre lieu</option>
            </select>
          </label>
          <label>
            Durée
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            >
              {[15, 25, 45, 60, 90, 120, 180, 240].map((d) => (
                <option value={d} key={d}>
                  {d} minutes
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Un mot pour le groupe <span className="optional">facultatif</span>
          <textarea
            rows={2}
            maxLength={240}
            placeholder="Travail en silence, puis on échange à la fin…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <p className="hint">
          Le minuteur démarre à la création. Rejoins ton vocal dans Discord,
          puis partage le lien de la session.
        </p>
        <ErrorNote message={error} />
        <button
          className="button primary wide"
          disabled={busy || !title.trim()}
        >
          {busy ? "Création…" : "Créer et rejoindre"}
          <Compass size={18} />
        </button>
      </form>
    </Modal>
  );
}
export function JoinForm({
  onClose,
  onJoin,
}: {
  onClose: () => void;
  onJoin: (id: string) => void;
}) {
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  function submit(e: FormEvent) {
    e.preventDefault();
    const raw = link.trim();
    let id = raw;
    try {
      if (raw.includes("/")) {
        const url = new URL(raw, location.origin);
        id = url.pathname.split("/sessions/")[1]?.split("/")[0] ?? "";
      }
    } catch {
      id = "";
    }
    if (!/^[a-zA-Z0-9_-]{16}$/.test(id)) {
      setError(
        "Collez le lien de session complet ou son code de 16 caractères.",
      );
      return;
    }
    onJoin(id);
  }
  return (
    <Modal title="Retrouve ton équipe" onClose={onClose}>
      <form onSubmit={submit}>
        <label>
          Lien ou code de la session
          <input
            autoFocus
            required
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Colle le lien partagé dans Discord"
          />
        </label>
        <ErrorNote message={error} />
        <button className="button primary wide">
          Ouvrir l’invitation
          <ArrowRight size={18} />
        </button>
      </form>
    </Modal>
  );
}
export function ShareForm({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const url = `${location.origin}/sessions/${id}`;
  const [copied, setCopied] = useState(false);
  return (
    <Modal title="L’aventure se partage." onClose={onClose}>
      <p className="modal-description">
        Partage ce lien avec tes coéquipiers. Ils pourront rejoindre la session
        et consulter les objectifs du groupe.
      </p>
      <label>
        Lien d’invitation
        <input readOnly value={url} onFocus={(e) => e.target.select()} />
      </label>
      <button
        className="button primary wide"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
          } catch {
            setCopied(false);
          }
        }}
      >
        {copied ? <Check size={18} /> : <Copy size={18} />}{" "}
        {copied ? "Lien copié" : "Copier le lien"}
      </button>
      <p className="hint">
        En local, ce lien fonctionne sur cet ordinateur. Un hébergement partagé
        sera nécessaire pour inviter le groupe à distance.
      </p>
    </Modal>
  );
}
