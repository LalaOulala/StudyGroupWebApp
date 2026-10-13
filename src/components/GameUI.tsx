import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { ArrowUpRight, Check, Flag, Gamepad2, Sparkles, X } from "lucide-react";
import { playerProgress, worldProgress } from "../game";

export function WindowBar({
  children,
  tone = "blue",
  end,
}: {
  children: ReactNode;
  tone?: string;
  end?: ReactNode;
}) {
  return (
    <div className={`window-bar ${tone}`}>
      <span className="window-dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span>{children}</span>
      {end && <span className="window-bar-end">{end}</span>}
    </div>
  );
}
export function Meter({
  value,
  label,
  tone = "green",
}: {
  value: number;
  label: string;
  tone?: string;
}) {
  const percent = Math.max(0, Math.min(100, value));
  return (
    <div
      className={`game-meter ${tone}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
    >
      <div style={{ width: `${percent}%` }} />
    </div>
  );
}
export function Mascot({ className = "" }: { className?: string }) {
  return (
    <img
      className={`mascot ${className}`}
      src="/companion.png"
      width="310"
      height="384"
      alt=""
      draggable="false"
    />
  );
}
export function PlayerXP({
  xp,
  compact = false,
}: {
  xp: number;
  compact?: boolean;
}) {
  const player = playerProgress(xp);
  return (
    <div className={`player-xp ${compact ? "compact" : ""}`}>
      <div className="player-xp-label">
        <span>
          {compact
            ? "Prêt pour la suite ?"
            : `Prochain niveau : ${String(player.level + 1).padStart(2, "0")}`}
        </span>
        <span className="mono">
          NIV. {String(player.level).padStart(2, "0")}
        </span>
      </div>
      <div className="player-xp-meter">
        <Meter
          value={player.progress}
          label="Progression vers le prochain niveau"
          tone="blue"
        />
        <strong>
          {player.progress}
          <span> / 100 XP</span>
        </strong>
      </div>
      {!compact && (
        <p>
          {player.remaining} XP pour le prochain niveau. Chaque bilan compte.
        </p>
      )}
    </div>
  );
}
export function WorldHUD({
  xp,
  onExplore,
}: {
  xp: number;
  onExplore?: () => void;
}) {
  const { next, percent } = worldProgress(xp);
  return (
    <div className="world-hud">
      <Flag className="hud-flag" size={27} />
      <div className="hud-label">
        <strong>Objectif collectif</strong>
        <span>{next ? next.name : "Citadelle débloquée !"}</span>
      </div>
      <Meter value={percent} label="Progression de l’étape collective" />
      <span className="hud-xp">
        {xp}
        <span> / {next?.xp ?? 500} XP</span>
      </span>
      {onExplore && (
        <button className="button yellow" onClick={onExplore}>
          Explorer la carte <ArrowUpRight size={18} />
        </button>
      )}
    </div>
  );
}

type Feedback = {
  title: string;
  detail: string;
  kind?: "quest" | "reward";
  amount?: number;
};
const FeedbackContext = createContext<(feedback: Feedback) => void>(() => {});
export const useFeedback = () => useContext(FeedbackContext);
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [feedback, setFeedback] = useState<(Feedback & { id: number }) | null>(
    null,
  );
  const celebrate = useCallback(
    (next: Feedback) => setFeedback({ ...next, id: Date.now() }),
    [],
  );
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 5500);
    return () => clearTimeout(timer);
  }, [feedback]);
  return (
    <FeedbackContext.Provider value={celebrate}>
      {children}
      <div
        className="feedback-region"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {feedback && (
          <div
            key={feedback.id}
            className={`game-toast ${feedback.kind === "reward" ? "reward" : ""}`}
          >
            <div className="toast-icon">
              {feedback.kind === "reward" ? <Mascot /> : <Check size={26} />}
            </div>
            <div>
              {feedback.amount !== undefined && feedback.amount > 0 && (
                <div className="xp-pop">+{feedback.amount} XP</div>
              )}
              <strong>{feedback.title}</strong>
              <p>{feedback.detail}</p>
            </div>
            <button
              className="icon-button"
              onClick={() => setFeedback(null)}
              aria-label="Fermer la notification"
            >
              <X size={17} />
            </button>
            <span className="pixel-confetti" aria-hidden="true">
              {Array.from({ length: 9 }, (_, i) => (
                <i key={i} style={{ "--i": i } as CSSProperties} />
              ))}
            </span>
          </div>
        )}
      </div>
    </FeedbackContext.Provider>
  );
}
export function GameLogo() {
  return (
    <span className="game-logo" aria-hidden="true">
      <Gamepad2 size={30} strokeWidth={2.6} />
    </span>
  );
}
export function RewardStamp({ earned }: { earned: number }) {
  return (
    <div className="reward-stamp">
      <Sparkles size={20} />
      <strong>+{earned} XP</strong>
      <span>pour l’équipe</span>
    </div>
  );
}
