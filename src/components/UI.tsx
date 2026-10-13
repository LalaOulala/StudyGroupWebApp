import { useEffect, useId, useRef, type ReactNode } from "react";
import { X, ArrowRight, Gamepad2 } from "lucide-react";
import type { User } from "../types";
import { Mascot, WindowBar } from "./GameUI";

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
      <Mascot />
      <b>{Array.from(user.name)[0]?.toUpperCase() ?? "?"}</b>
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
  const titleId = useId();
  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby={titleId}
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
        <span className="window-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <h2 id={titleId}>{title}</h2>
        <button className="icon-button" onClick={onClose} aria-label="Fermer">
          <X size={20} />
        </button>
      </div>
      <div className="modal-body">{children}</div>
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
export function Empty({
  onCreate,
  ended = false,
}: {
  onCreate: () => void;
  ended?: boolean;
}) {
  return (
    <div className="empty">
      <Gamepad2 size={42} strokeWidth={1.8} />
      <h3>
        {ended
          ? "Tes prochaines victoires ont une place ici."
          : "La prochaine partie commence avec toi."}
      </h3>
      <p>
        {ended
          ? "Tes sessions terminées apparaîtront dans ce carnet."
          : "Crée une session ou rejoins ton équipe avec un lien."}
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
      <div className="loading-window">
        <WindowBar>Chargement</WindowBar>
        <Mascot />
        <div className="loading-pixels" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <p>On prépare ton espace…</p>
      </div>
    </div>
  );
}
