import { useEffect, useRef, type ReactNode } from "react";
import { X, ArrowRight, Compass, CalendarDays } from "lucide-react";
import type { User } from "../types";

export function Avatar({
  user,
  small = false,
}: {
  user: Pick<User, "name" | "color">;
  small?: boolean;
}) {
  return (
    <span
      className={`avatar ${user.color} ${small ? "small" : ""}`}
      aria-hidden="true"
    >
      {Array.from(user.name)[0]?.toUpperCase() ?? "?"}
    </span>
  );
}
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="modal-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="modal-heading">
        <h2 id="modal-title">{title}</h2>
        <button className="icon-button" onClick={onClose} aria-label="Fermer">
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function ErrorNote({ message }: { message: string }) {
  return message ? (
    <p className="error-note" role="alert">
      {message}
    </p>
  ) : null;
}
export function Banner({
  onExplore,
  xp,
}: {
  onExplore: () => void;
  xp: number;
}) {
  const stops: [number, string][] = [
    [60, "le camp de base"],
    [160, "la forêt des idées"],
    [300, "le col des possibles"],
    [500, "la citadelle du savoir"],
  ];
  const next = stops.find(([threshold]) => xp < threshold)?.[1];
  return (
    <section className="adventure-banner">
      <div>
        <h2>
          {next ? (
            <>
              Prochaine étape :<br />
              {next}.
            </>
          ) : (
            <>
              La citadelle est atteinte.
              <br />
              L’aventure continue.
            </>
          )}
        </h2>
        <p>Chaque session fait avancer notre expédition.</p>
        <button className="text-link" onClick={onExplore}>
          Explorer la carte <ArrowRight size={18} />
        </button>
      </div>
    </section>
  );
}
export function Empty({
  onCreate,
  ended = false,
}: {
  onCreate: () => void;
  ended?: boolean;
}) {
  return (
    <div className="empty">
      <CalendarDays size={25} />
      <h3>
        {ended
          ? "Les souvenirs se construisent en chemin."
          : "Votre prochaine quête commence ici."}
      </h3>
      <p>
        {ended
          ? "Vos sessions terminées apparaîtront ici."
          : "Invitez votre groupe à avancer avec vous."}
      </p>
      <button className="text-link" onClick={onCreate}>
        {ended ? "Lancer une session" : "Créer la première session"}{" "}
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <Compass className="spin" size={27} />
      <p>On prépare votre espace…</p>
    </div>
  );
}
