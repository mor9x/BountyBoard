import { KILLMAIL_LOSS_TYPE, type MirrorCharacterLookup } from "@bounty-board/frontier-client";
import { useQuery } from "@tanstack/react-query";
import { useDeferredValue, useEffect, useRef, useState } from "react";
import { frontierClient } from "../lib/frontier";
import { formatMessage, getTranslation } from "../lib/language";

export type KillmailFormValue = {
  killerId: string;
  victimId: string;
  lossType: number;
  solarSystemId: string;
  killmailItemId: string;
  killTimestamp: string;
};

type KillmailControlPanelProps = {
  currentLang: "en" | "zh";
  reportedByCharacter: MirrorCharacterLookup | null;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (value: KillmailFormValue) => Promise<string | null>;
};

type AudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

type Direction = "up" | "down" | "left" | "right";

type Controls = {
  up: string;
  down: string;
  left: string;
  right: string;
  shoot: string;
  direction: Direction;
};

type Bullet = {
  x: number;
  y: number;
  size: number;
  color: string;
  direction: Direction;
};

type ShipState = {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  direction: Direction;
  health: number;
  bullets: Bullet[];
  controls: Controls;
};

type Particle = {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  life: number;
};

type Star = {
  x: number;
  y: number;
  size: number;
  speed: number;
};

type DuelWinner = "P1" | "P2";

const GAME_CONFIG = {
  shipSize: 46,
  bulletSize: 6,
  bulletSpeed: 8,
  shipSpeed: 4.5,
  maxBullets: 5,
  maxHealth: 5,
  starCount: 110
} as const;

function getExplorerTransactionUrl(transactionDigest: string) {
  return `https://suiscan.xyz/testnet/tx/${transactionDigest}`;
}

function isPositiveIntegerString(value: string) {
  return /^[1-9]\d*$/.test(value);
}

function createStars(width: number, height: number) {
  return Array.from({ length: GAME_CONFIG.starCount }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 2 + 0.5,
    speed: Math.random() * 0.45 + 0.15
  }));
}

function createShip(x: number, y: number, color: string, controls: Controls): ShipState {
  return {
    x,
    y,
    width: GAME_CONFIG.shipSize,
    height: GAME_CONFIG.shipSize,
    color,
    controls,
    direction: controls.direction,
    bullets: [],
    health: GAME_CONFIG.maxHealth
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function drawShip(ctx: CanvasRenderingContext2D, ship: ShipState) {
  const centerX = ship.x + ship.width / 2;
  const centerY = ship.y + ship.height / 2;

  ctx.save();
  ctx.shadowColor = ship.color;
  ctx.shadowBlur = 14;
  ctx.fillStyle = ship.color;
  ctx.beginPath();

  if (ship.direction === "up") {
    ctx.moveTo(centerX, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
  } else if (ship.direction === "down") {
    ctx.moveTo(centerX, ship.y + ship.height);
    ctx.lineTo(ship.x, ship.y);
    ctx.lineTo(ship.x + ship.width, ship.y);
  } else if (ship.direction === "left") {
    ctx.moveTo(ship.x, centerY);
    ctx.lineTo(ship.x + ship.width, ship.y);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
  } else {
    ctx.moveTo(ship.x + ship.width, centerY);
    ctx.lineTo(ship.x, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.height);
  }

  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawBullets(ctx: CanvasRenderingContext2D, bullets: Bullet[]) {
  for (const bullet of bullets) {
    ctx.save();
    ctx.shadowColor = bullet.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = bullet.color;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawLabel(ctx: CanvasRenderingContext2D, ship: ShipState, label: string) {
  ctx.save();
  ctx.font = "12px Orbitron, monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
  ctx.lineWidth = 4;
  const textX = ship.x + ship.width / 2;
  const textY = ship.y - 12;
  ctx.strokeText(label, textX, textY);
  ctx.fillText(label, textX, textY);
  ctx.restore();
}

function drawStars(ctx: CanvasRenderingContext2D, stars: Star[]) {
  ctx.fillStyle = "#ffffff";
  for (const star of stars) {
    ctx.fillRect(star.x, star.y, star.size, star.size);
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const particle of particles) {
    ctx.save();
    ctx.globalAlpha = particle.life;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function renderHealthBlocks(current: number) {
  return Array.from({ length: GAME_CONFIG.maxHealth }, (_, index) => (
    <span
      key={index}
      className={`h-4 w-9 border-2 ${
        index < current
          ? "border-[#ffb36e] bg-[#ff6a00] shadow-[0_0_14px_rgba(255,106,0,0.4)]"
          : "border-white/15 bg-[#1a1a1a]"
      }`}
    />
  ));
}

export function KillmailControlPanel({
  currentLang,
  reportedByCharacter,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit
}: KillmailControlPanelProps) {
  const t = (key: string) => getTranslation(currentLang, key);
  const fm = (key: string, params: Record<string, string | number>) => formatMessage(currentLang, key, params);
  const environment = frontierClient.environment;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const audioContextRef = useRef<AudioContext | null>(null);
  const playersRef = useRef<{ p1: ShipState; p2: ShipState } | null>(null);
  const starsRef = useRef<Star[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const runningRef = useRef(false);
  const [targetUID, setTargetUID] = useState("");
  const [health, setHealth] = useState({ p1: GAME_CONFIG.maxHealth, p2: GAME_CONFIG.maxHealth });
  const [duelPhase, setDuelPhase] = useState<"setup" | "running" | "finished">("setup");
  const [winner, setWinner] = useState<DuelWinner | null>(null);
  const [submissionPhase, setSubmissionPhase] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submissionError, setSubmissionError] = useState("");
  const [transactionDigest, setTransactionDigest] = useState<string | null>(null);
  const deferredTargetUID = useDeferredValue(targetUID.trim());
  const targetItemId = isPositiveIntegerString(deferredTargetUID) ? Number(deferredTargetUID) : null;
  const isLookupStale = targetUID.trim() !== deferredTargetUID;
  const targetCharacterQuery = useQuery({
    queryKey: [
      "killmail-duel-target",
      environment.simulationWorldPackageId,
      environment.worldObjectRegistryId,
      targetItemId,
      reportedByCharacter?.tenant ?? "utopia"
    ],
    enabled: Boolean(isOpen && reportedByCharacter && targetItemId),
    queryFn: async () =>
      frontierClient.getCharacterByItemId({
        worldPackageId: environment.simulationWorldPackageId,
        worldObjectRegistryId: environment.worldObjectRegistryId,
        itemId: targetItemId!,
        tenant: reportedByCharacter?.tenant ?? "utopia"
      })
  });
  const targetCharacter = (targetCharacterQuery.data ?? null) as MirrorCharacterLookup | null;
  const targetLookupError = targetCharacterQuery.error instanceof Error ? targetCharacterQuery.error.message : null;

  function stopLoop() {
    runningRef.current = false;
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }

  function getAudioContext() {
    if (typeof window === "undefined") {
      return null;
    }

    const audioWindow = window as AudioWindow;
    const AudioContextCtor = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
    if (!AudioContextCtor) {
      return null;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextCtor();
    }

    return audioContextRef.current;
  }

  function playSound(frequency: number, duration: number, type: OscillatorType) {
    const audioContext = getAudioContext();
    if (!audioContext) {
      return;
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    gainNode.gain.setValueAtTime(0.18, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  }

  function playShotSound() {
    playSound(720, 0.08, "square");
  }

  function playHitSound() {
    playSound(130, 0.2, "sawtooth");
  }

  function playVictorySound() {
    const notes = [523, 659, 784, 1047];
    for (const [index, note] of notes.entries()) {
      window.setTimeout(() => playSound(note, 0.18, "square"), index * 120);
    }
  }

  function resizeCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const parent = canvas.parentElement;
    const rect = parent?.getBoundingClientRect();
    const width = Math.max(640, Math.floor(rect?.width ?? window.innerWidth * 0.84));
    const height = Math.max(420, Math.floor(rect?.height ?? window.innerHeight * 0.64));
    canvas.width = width;
    canvas.height = height;
    starsRef.current = createStars(width, height);
  }

  function resetWorld() {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    playersRef.current = {
      p1: createShip(92, canvas.height / 2 - GAME_CONFIG.shipSize / 2, "#ff7a1a", {
        up: "w",
        down: "s",
        left: "a",
        right: "d",
        shoot: " ",
        direction: "right"
      }),
      p2: createShip(canvas.width - 92 - GAME_CONFIG.shipSize, canvas.height / 2 - GAME_CONFIG.shipSize / 2, "#ffd166", {
        up: "ArrowUp",
        down: "ArrowDown",
        left: "ArrowLeft",
        right: "ArrowRight",
        shoot: "Enter",
        direction: "left"
      })
    };
    particlesRef.current = [];
    setHealth({ p1: GAME_CONFIG.maxHealth, p2: GAME_CONFIG.maxHealth });
  }

  function createExplosion(x: number, y: number, color: string) {
    for (let index = 0; index < 26; index += 1) {
      particlesRef.current.push({
        x,
        y,
        size: Math.random() * 4 + 2,
        speedX: (Math.random() - 0.5) * 8,
        speedY: (Math.random() - 0.5) * 8,
        color,
        life: 1
      });
    }
    playHitSound();
  }

  function drawScene() {
    const canvas = canvasRef.current;
    const players = playersRef.current;
    if (!canvas || !players) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.fillStyle = "#000000";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const gradient = context.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      canvas.width * 0.56
    );
    gradient.addColorStop(0, "rgba(255, 122, 26, 0.06)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawStars(context, starsRef.current);
    drawParticles(context, particlesRef.current);
    drawShip(context, players.p1);
    drawShip(context, players.p2);
    drawLabel(context, players.p1, reportedByCharacter?.metadata.name ?? "P1");
    drawLabel(context, players.p2, targetCharacter?.metadata.name ?? "P2");
    drawBullets(context, players.p1.bullets);
    drawBullets(context, players.p2.bullets);
  }

  function spawnBullet(player: ShipState) {
    if (player.bullets.length >= GAME_CONFIG.maxBullets) {
      return;
    }

    player.bullets.push({
      x: player.x + player.width / 2,
      y: player.y + player.height / 2,
      size: GAME_CONFIG.bulletSize,
      color: player.color,
      direction: player.direction
    });
    playShotSound();
  }

  async function emitKillmail(result: DuelWinner) {
    if (!reportedByCharacter || !targetCharacter) {
      return;
    }

    const killerId = result === "P1" ? reportedByCharacter.itemId : targetCharacter.itemId;
    const victimId = result === "P1" ? targetCharacter.itemId : reportedByCharacter.itemId;
    const killmailItemId = Date.now();
    const killTimestamp = Math.floor(Date.now() / 1000);

    setSubmissionPhase("submitting");
    setSubmissionError("");
    setTransactionDigest(null);

    try {
      const digest = await onSubmit({
        killerId: String(killerId),
        victimId: String(victimId),
        lossType: KILLMAIL_LOSS_TYPE.ship,
        solarSystemId: "300001",
        killmailItemId: String(killmailItemId),
        killTimestamp: String(killTimestamp)
      });
      setSubmissionPhase("success");
      setTransactionDigest(digest);
    } catch (error) {
      setSubmissionPhase("error");
      setSubmissionError(error instanceof Error ? error.message : "Failed to emit killmail");
    }
  }

  function finishGame(result: DuelWinner) {
    stopLoop();
    setWinner(result);
    setDuelPhase("finished");
    setSubmissionPhase("idle");
    playVictorySound();
    void emitKillmail(result);
  }

  function updatePlayerMovement(player: ShipState, canvas: HTMLCanvasElement) {
    const { controls } = player;

    if (keysRef.current[controls.up]) {
      player.y = clamp(player.y - GAME_CONFIG.shipSpeed, 0, canvas.height - player.height);
      player.direction = "up";
    }
    if (keysRef.current[controls.down]) {
      player.y = clamp(player.y + GAME_CONFIG.shipSpeed, 0, canvas.height - player.height);
      player.direction = "down";
    }
    if (keysRef.current[controls.left]) {
      player.x = clamp(player.x - GAME_CONFIG.shipSpeed, 0, canvas.width - player.width);
      player.direction = "left";
    }
    if (keysRef.current[controls.right]) {
      player.x = clamp(player.x + GAME_CONFIG.shipSpeed, 0, canvas.width - player.width);
      player.direction = "right";
    }
  }

  function updateBullets(player: ShipState, target: ShipState, targetKey: "p1" | "p2", winnerKey: DuelWinner, canvas: HTMLCanvasElement) {
    player.bullets = player.bullets.filter((bullet) => {
      if (bullet.direction === "right") {
        bullet.x += GAME_CONFIG.bulletSpeed;
      } else if (bullet.direction === "left") {
        bullet.x -= GAME_CONFIG.bulletSpeed;
      } else if (bullet.direction === "up") {
        bullet.y -= GAME_CONFIG.bulletSpeed;
      } else {
        bullet.y += GAME_CONFIG.bulletSpeed;
      }

      const hit =
        bullet.x > target.x &&
        bullet.x < target.x + target.width &&
        bullet.y > target.y &&
        bullet.y < target.y + target.height;

      if (hit) {
        target.health -= 1;
        createExplosion(target.x + target.width / 2, target.y + target.height / 2, target.color);
        setHealth((previous) => ({
          ...previous,
          [targetKey]: Math.max(0, target.health)
        }));
        if (target.health <= 0) {
          finishGame(winnerKey);
        }
        return false;
      }

      return bullet.x >= -20 && bullet.x <= canvas.width + 20 && bullet.y >= -20 && bullet.y <= canvas.height + 20;
    });
  }

  function updateWorld() {
    const canvas = canvasRef.current;
    const players = playersRef.current;
    if (!canvas || !players || !runningRef.current) {
      return;
    }

    updatePlayerMovement(players.p1, canvas);
    updatePlayerMovement(players.p2, canvas);
    updateBullets(players.p1, players.p2, "p2", "P1", canvas);
    if (!runningRef.current) {
      return;
    }
    updateBullets(players.p2, players.p1, "p1", "P2", canvas);

    starsRef.current = starsRef.current.map((star) => ({
      ...star,
      y: star.y + star.speed > canvas.height ? 0 : star.y + star.speed
    }));
    particlesRef.current = particlesRef.current
      .map((particle) => ({
        ...particle,
        x: particle.x + particle.speedX,
        y: particle.y + particle.speedY,
        life: particle.life - 0.02
      }))
      .filter((particle) => particle.life > 0);
  }

  function loop() {
    if (!runningRef.current) {
      return;
    }

    updateWorld();
    drawScene();
    frameRef.current = requestAnimationFrame(loop);
  }

  function startGame() {
    if (!reportedByCharacter || !targetCharacter) {
      return;
    }

    resizeCanvas();
    resetWorld();
    setWinner(null);
    setSubmissionPhase("idle");
    setSubmissionError("");
    setDuelPhase("running");
    keysRef.current = {};
    runningRef.current = true;

    const audioContext = getAudioContext();
    if (audioContext?.state === "suspended") {
      void audioContext.resume();
    }

    drawScene();
    loop();
  }

  function resetDuel() {
    stopLoop();
    keysRef.current = {};
    setWinner(null);
    setSubmissionPhase("idle");
    setSubmissionError("");
    setTransactionDigest(null);
    setDuelPhase("setup");
    resizeCanvas();
    resetWorld();
    drawScene();
  }

  useEffect(() => {
    if (!isOpen) {
      stopLoop();
      return;
    }

    resizeCanvas();
    resetWorld();
    drawScene();

    const handleResize = () => {
      resizeCanvas();
      if (!runningRef.current) {
        resetWorld();
      }
      drawScene();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const activeKeys = new Set(["w", "a", "s", "d", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Enter"]);
      if (!activeKeys.has(event.key)) {
        return;
      }

      event.preventDefault();
      keysRef.current[event.key] = true;

      if (!runningRef.current || !playersRef.current) {
        return;
      }

      if (event.key === playersRef.current.p1.controls.shoot) {
        spawnBullet(playersRef.current.p1);
      }
      if (event.key === playersRef.current.p2.controls.shoot) {
        spawnBullet(playersRef.current.p2);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      keysRef.current[event.key] = false;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      stopLoop();
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setWinner(null);
      setSubmissionPhase("idle");
      setSubmissionError("");
      setTransactionDigest(null);
      setDuelPhase("setup");
      resizeCanvas();
      resetWorld();
      drawScene();
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-white/15 bg-black/95 px-6 py-4">
          <div>
            <h2 className="text-lg uppercase tracking-[0.2em] text-white">{t("killmail.duelTitle")}</h2>
            <p className="font-mono text-xs text-white/50">{t("killmail.duelSubtitle")}</p>
          </div>
          <button className="btn-secondary px-4 py-2 text-sm" onClick={onClose} type="button">
            {t("common.close")}
          </button>
        </div>

        <div className="grid flex-1 gap-5 overflow-hidden px-5 py-5 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="custom-scrollbar overflow-y-auto border border-white/10 bg-[#090909] p-4">
            <div className="app-stack-md">
              <section className="app-panel-inset app-stack-sm">
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">{t("killmail.playerOne")}</div>
                <div className="font-mono text-sm text-white">
                  {reportedByCharacter?.metadata.name ?? "--"} / {reportedByCharacter?.itemId ?? "--"}
                </div>
              </section>

              <section className="app-panel-inset app-stack-sm">
                <label className="block text-sm text-white/70">{t("killmail.targetUID")}</label>
                <input
                  className="w-full px-4 py-3 font-mono text-sm"
                  onChange={(event) => setTargetUID(event.target.value)}
                  placeholder={t("killmail.targetUIDPlaceholder")}
                  type="text"
                  value={targetUID}
                />

                {!reportedByCharacter ? (
                  <p className="font-mono text-xs text-[#FF0000]">{t("killmail.missingReporter")}</p>
                ) : targetUID.trim().length === 0 ? null : isLookupStale || targetCharacterQuery.isLoading || targetCharacterQuery.isFetching ? (
                  <p className="font-mono text-xs text-white/60">{t("killmail.targetLookupLoading")}</p>
                ) : targetItemId === null ? (
                  <p className="font-mono text-xs text-[#FF0000]">{t("killmail.targetLookupInvalid")}</p>
                ) : targetLookupError ? (
                  <p className="font-mono text-xs text-[#FF0000]">
                    {fm("killmail.targetLookupError", { message: targetLookupError })}
                  </p>
                ) : targetCharacter ? (
                  <div className="app-panel-inset app-stack-xs">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                      {t("killmail.targetLookupFound")}
                    </div>
                    <div className="font-mono text-sm text-white">
                      {targetCharacter.metadata.name ?? "--"} / {targetCharacter.itemId}
                    </div>
                    <div className="app-stack-xs">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">{t("killmail.targetLookupObjectId")}</div>
                      <div className="break-all font-mono text-xs text-white/70">{targetCharacter.objectId}</div>
                    </div>
                  </div>
                ) : targetCharacterQuery.isFetched ? (
                  <p className="font-mono text-xs text-[#FF0000]">{t("killmail.targetLookupMissing")}</p>
                ) : null}
              </section>

              <section className="app-panel-inset app-stack-sm">
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">{t("killmail.controlsTitle")}</div>
                <div className="font-mono text-xs text-white/60">{t("killmail.controlP1Move")}</div>
                <div className="font-mono text-xs text-white/60">{t("killmail.controlP1Shoot")}</div>
                <div className="font-mono text-xs text-white/60">{t("killmail.controlP2Move")}</div>
                <div className="font-mono text-xs text-white/60">{t("killmail.controlP2Shoot")}</div>
              </section>

              <section className="app-panel-inset app-stack-sm">
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">{t("killmail.worldConfig")}</div>
                <div className="app-stack-xs">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">{t("killmail.worldPackage")}</div>
                  <div className="break-all font-mono text-xs text-white/70">{environment.simulationWorldPackageId || "--"}</div>
                </div>
                <div className="app-stack-xs">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">{t("killmail.killmailRegistry")}</div>
                  <div className="break-all font-mono text-xs text-white/70">
                    {environment.simulationWorldKillmailRegistryId || "--"}
                  </div>
                </div>
                <div className="app-stack-xs">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">{t("killmail.adminAcl")}</div>
                  <div className="break-all font-mono text-xs text-white/70">{environment.simulationWorldAdminAclId || "--"}</div>
                </div>
              </section>

              <section className="app-panel-inset app-stack-sm">
                <button
                  className="btn-primary px-4 py-3 text-sm"
                  disabled={!reportedByCharacter || !targetCharacter || isSubmitting || submissionPhase === "submitting"}
                  onClick={startGame}
                  type="button"
                >
                  {t("killmail.startDuel")}
                </button>
                <p className="font-mono text-xs text-white/50">{t("killmail.startHint")}</p>
              </section>
            </div>
          </aside>

          <section className="relative flex min-h-0 flex-col border border-white/10 bg-[#050505]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex gap-6">
                <div className="app-stack-xs">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[#ffb36e]">P1</div>
                  <div className="font-mono text-sm text-white">{reportedByCharacter?.metadata.name ?? "--"}</div>
                  <div className="flex flex-wrap gap-2">
                    {renderHealthBlocks(health.p1)}
                  </div>
                </div>
                <div className="app-stack-xs">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[#ffe3a1]">P2</div>
                  <div className="font-mono text-sm text-white">{targetCharacter?.metadata.name ?? "--"}</div>
                  <div className="flex flex-wrap gap-2">
                    {renderHealthBlocks(health.p2)}
                  </div>
                </div>
              </div>
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">
                {duelPhase === "running" ? t("killmail.duelRunning") : t("killmail.duelStandby")}
              </div>
            </div>

            <div className="relative min-h-0 flex-1">
              <canvas
                ref={canvasRef}
                className="block h-full w-full bg-black"
                style={{ background: "radial-gradient(circle at center, rgba(255,122,26,0.08) 0%, #050505 48%, #000000 100%)" }}
              />

              {duelPhase !== "running" ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/72 px-6">
                  <div className="w-full max-w-xl border border-white/15 bg-[#0b0b0b] p-8 text-center">
                    <div className="text-2xl uppercase tracking-[0.2em] text-white">{t("killmail.duelTitle")}</div>
                    <div className="mt-3 font-mono text-sm text-white/60">
                      {winner
                        ? fm("killmail.winnerMessage", {
                            winner: winner === "P1" ? reportedByCharacter?.metadata.name ?? "P1" : targetCharacter?.metadata.name ?? "P2"
                          })
                        : t("killmail.preMatchMessage")}
                    </div>

                    {submissionPhase === "submitting" || isSubmitting ? (
                      <p className="mt-5 font-mono text-xs text-[#ffb36e]">{t("killmail.emitting")}</p>
                    ) : null}
                    {submissionPhase === "success" ? (
                      <div className="mt-5 grid justify-center gap-3">
                        <p className="font-mono text-xs text-[#8dffc0]">{t("killmail.emitSuccess")}</p>
                        {transactionDigest ? (
                          <div className="app-panel-inset app-stack-xs max-w-full px-4 py-3 text-left">
                            <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                              {t("killmail.transactionHash")}
                            </div>
                            <div className="break-all font-mono text-xs text-white/75">{transactionDigest}</div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    {submissionPhase === "error" ? (
                      <p className="mt-5 font-mono text-xs text-[#ff7d7d]">
                        {fm("killmail.emitError", { message: submissionError || t("killmail.emitErrorFallback") })}
                      </p>
                    ) : null}

                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                      {winner ? (
                        <button
                          className="btn-primary px-5 py-3 text-sm"
                          disabled={submissionPhase === "submitting" || isSubmitting || !reportedByCharacter || !targetCharacter}
                          onClick={resetDuel}
                          type="button"
                        >
                          {t("killmail.restart")}
                        </button>
                      ) : (
                        <button
                          className="btn-primary px-5 py-3 text-sm"
                          disabled={!reportedByCharacter || !targetCharacter}
                          onClick={startGame}
                          type="button"
                        >
                          {t("killmail.startDuel")}
                        </button>
                      )}
                      {submissionPhase === "success" && transactionDigest ? (
                        <a
                          className="btn-secondary px-5 py-3 text-sm"
                          href={getExplorerTransactionUrl(transactionDigest)}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {t("killmail.viewOnExplorer")}
                        </a>
                      ) : null}
                      <button className="btn-secondary px-5 py-3 text-sm" onClick={onClose} type="button">
                        {t("common.close")}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
