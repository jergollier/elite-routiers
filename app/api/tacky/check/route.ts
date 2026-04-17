const { shell } = require("electron");
const https = require("https");
const fs = require("fs");
const path = require("path");
const os = require("os");

const connectBtn = document.getElementById("connectBtn");
const driverName = document.getElementById("driverName");
const statusSite = document.getElementById("statusSite");
const statusGame = document.getElementById("statusGame");
const statusDelivery = document.getElementById("statusDelivery");
const statusTruck = document.getElementById("statusTruck");

const speedValue = document.getElementById("speed");
const speedTop = document.getElementById("speedTop");
const etat = document.getElementById("etat");
const lcd = document.querySelector(".lcd");

const driveTime = document.getElementById("driveTime");
const remainingKmText = document.getElementById("remainingKm");
const missionText = document.getElementById("mission");
const truckText = document.getElementById("truck");

const homeMessage = document.getElementById("homeMessage");
const homeMission = document.getElementById("homeMission");
const homeTruck = document.getElementById("homeTruck");

const pauseTitle = document.getElementById("pauseTitle");
const pauseCountdown = document.getElementById("pauseCountdown");
const pauseStatus = document.getElementById("pauseStatus");

const screenHome = document.getElementById("screenHome");
const screenDrive = document.getElementById("screenDrive");
const screenPause = document.getElementById("screenPause");

const btnHome = document.getElementById("btnHome");
const btnDrive = document.getElementById("btnDrive");
const btnPause = document.getElementById("btnPause");

const configPath = path.join(os.homedir(), "elite-routiers-tacky.json");
const telemetryPath = "C:/elite-routiers-tacky/telemetry.json";
const statePath = path.join(os.homedir(), "elite-routiers-tacky-state.json");

const STATUS_DELAY_MS = 3000;
const PAUSE_UNLOCK_AFTER_SECONDS = 3600;
const PAUSE_DURATION_SECONDS = 10 * 60;
const DRIVE_TOTAL_SECONDS = 2 * 3600 + 30 * 60;
const WARNING_15_MIN_SECONDS = 15 * 60;
const WARNING_5_MIN_SECONDS = 5 * 60;
const INFRACTION_FINE_EVERY_SECONDS = 30;
const INFRACTION_FINE_AMOUNT = 135;
const RESET_AFTER_OFFLINE_SECONDS = 3 * 3600;

let currentSteamId = null;
let currentMode = "drive";

let conduiteSecondsRestants = DRIVE_TOTAL_SECONDS;
let conduiteSecondsEffectives = 0;
let conduiteCycleStarted = false;
let infractionActive = false;
let infractionSeconds = 0;
let amendeTotale = 0;

let warning15Played = false;
let warning5Played = false;

let lastTelemetrySpeed = 0;
let lastMissionDistanceKm = 0;
let lastParkingBrake = false;

let pauseSecondsRestants = PAUSE_DURATION_SECONDS;
let pauseActive = false;

let lastGameOk = 0;
let lastDeliveryOk = 0;
let lastTruckOk = 0;

let stableTelemetry = {
  speedKph: 0,
  odometerKm: 0,
  sourceCity: "",
  destinationCity: "",
  truck: "",
  cargo: "",
  jobDistanceKm: 0,
  missionActive: false,
  parkingBrake: false,
};

let missionState = {
  active: false,
  truck: "",
  cargo: "",
  sourceCity: "",
  destinationCity: "",
  startedAt: null,
  lastMissionActive: false,
  livraisonId: null,
  startSent: false,
  endSent: false,
};

function text(value) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatDuration(seconds) {
  const safe = Math.max(0, Math.floor(seconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  return `${h}H${String(m).padStart(2, "0")}`;
}

function formatPause(seconds) {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function playBeep(frequency = 900, duration = 250, volume = 0.03) {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gainNode.gain.value = volume;

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();

    setTimeout(() => {
      try {
        oscillator.stop();
      } catch {}
      audioContext.close().catch(() => {});
    }, duration);
  } catch (error) {
    console.error("Erreur beep :", error);
  }
}

function play15MinBeep() {
  playBeep(900, 250, 0.03);
}

function play5MinBeep() {
  playBeep(1200, 400, 0.04);
}

function playInfractionBeep() {
  playBeep(700, 500, 0.05);
}

function getDefaultState() {
  return {
    conduiteSecondsRestants: DRIVE_TOTAL_SECONDS,
    conduiteSecondsEffectives: 0,
    conduiteCycleStarted: false,
    infractionActive: false,
    infractionSeconds: 0,
    amendeTotale: 0,
    pauseSecondsRestants: PAUSE_DURATION_SECONDS,
    pauseActive: false,
    warning15Played: false,
    warning5Played: false,
    missionState: {
      active: false,
      truck: "",
      cargo: "",
      sourceCity: "",
      destinationCity: "",
      startedAt: null,
      lastMissionActive: false,
      livraisonId: null,
      startSent: false,
      endSent: false,
    },
    savedAt: Date.now(),
  };
}

function saveRuntimeState() {
  try {
    const state = {
      conduiteSecondsRestants,
      conduiteSecondsEffectives,
      conduiteCycleStarted,
      infractionActive,
      infractionSeconds,
      amendeTotale,
      pauseSecondsRestants,
      pauseActive,
      warning15Played,
      warning5Played,
      missionState,
      savedAt: Date.now(),
    };

    fs.writeFileSync(statePath, JSON.stringify(state, null, 2), "utf-8");
  } catch (error) {
    console.error("Erreur saveRuntimeState :", error);
  }
}

function loadRuntimeState() {
  try {
    if (!fs.existsSync(statePath)) {
      return getDefaultState();
    }

    const raw = fs.readFileSync(statePath, "utf-8");
    const data = JSON.parse(raw);

    const savedAt = num(data.savedAt, 0);
    const offlineSeconds = Math.floor((Date.now() - savedAt) / 1000);

    if (!savedAt || offlineSeconds >= RESET_AFTER_OFFLINE_SECONDS) {
      return getDefaultState();
    }

    return {
      conduiteSecondsRestants: Math.max(
        0,
        num(data.conduiteSecondsRestants, DRIVE_TOTAL_SECONDS)
      ),
      conduiteSecondsEffectives: Math.max(
        0,
        num(data.conduiteSecondsEffectives, 0)
      ),
      conduiteCycleStarted: Boolean(data.conduiteCycleStarted),
      infractionActive: Boolean(data.infractionActive),
      infractionSeconds: Math.max(0, num(data.infractionSeconds, 0)),
      amendeTotale: Math.max(0, num(data.amendeTotale, 0)),
      pauseSecondsRestants: Math.max(
        0,
        num(data.pauseSecondsRestants, PAUSE_DURATION_SECONDS)
      ),
      pauseActive: Boolean(data.pauseActive),
      warning15Played: Boolean(data.warning15Played),
      warning5Played: Boolean(data.warning5Played),
      missionState: {
        active: Boolean(data?.missionState?.active),
        truck: text(data?.missionState?.truck),
        cargo: text(data?.missionState?.cargo),
        sourceCity: text(data?.missionState?.sourceCity),
        destinationCity: text(data?.missionState?.destinationCity),
        startedAt: data?.missionState?.startedAt ?? null,
        lastMissionActive: Boolean(data?.missionState?.lastMissionActive),
        livraisonId: data?.missionState?.livraisonId ?? null,
        startSent: Boolean(data?.missionState?.startSent),
        endSent: Boolean(data?.missionState?.endSent),
      },
      savedAt,
    };
  } catch (error) {
    console.error("Erreur loadRuntimeState :", error);
    return getDefaultState();
  }
}

function applyLoadedState() {
  const state = loadRuntimeState();

  conduiteSecondsRestants = state.conduiteSecondsRestants;
  conduiteSecondsEffectives = state.conduiteSecondsEffectives;
  conduiteCycleStarted = state.conduiteCycleStarted;
  infractionActive = state.infractionActive;
  infractionSeconds = state.infractionSeconds;
  amendeTotale = state.amendeTotale;
  pauseSecondsRestants = state.pauseSecondsRestants;
  pauseActive = state.pauseActive;
  warning15Played = state.warning15Played;
  warning5Played = state.warning5Played;
  missionState = state.missionState;
}

function showHomeScreen() {
  currentMode = "home";
  if (screenHome) screenHome.style.display = "block";
  if (screenDrive) screenDrive.style.display = "none";
  if (screenPause) screenPause.style.display = "none";
  if (etat && !infractionActive) etat.textContent = "État : Accueil";
}

function showDriveScreen() {
  currentMode = "drive";
  if (screenHome) screenHome.style.display = "none";
  if (screenDrive) screenDrive.style.display = "block";
  if (screenPause) screenPause.style.display = "none";
  if (etat && !infractionActive) etat.textContent = "État : Conduite";
}

function showPauseScreen() {
  currentMode = "pause";
  if (screenHome) screenHome.style.display = "none";
  if (screenDrive) screenDrive.style.display = "none";
  if (screenPause) screenPause.style.display = "block";
  if (etat) etat.textContent = "État : Pause";
}

function updateDriveColor() {
  if (!lcd) return;

  lcd.classList.remove("lcd-green", "lcd-orange", "lcd-red");

  if (pauseActive || infractionActive || conduiteSecondsRestants <= WARNING_5_MIN_SECONDS) {
    lcd.classList.add("lcd-red");
  } else if (conduiteSecondsRestants <= WARNING_15_MIN_SECONDS) {
    lcd.classList.add("lcd-orange");
  } else {
    lcd.classList.add("lcd-green");
  }
}

function updateStatusIndicators() {
  const now = Date.now();

  if (statusGame) {
    statusGame.textContent = "Jeu";
    statusGame.className =
      now - lastGameOk < STATUS_DELAY_MS ? "status ok" : "status off";
  }

  if (statusDelivery) {
    statusDelivery.textContent = "Livraison";
    statusDelivery.className =
      now - lastDeliveryOk < STATUS_DELAY_MS ? "status ok" : "status off";
  }

  if (statusTruck) {
    statusTruck.textContent = "Camion";
    statusTruck.className =
      now - lastTruckOk < STATUS_DELAY_MS ? "status ok" : "status off";
  }
}

function setConnected(pseudo) {
  if (driverName) driverName.textContent = pseudo || "Connecté";
  if (statusSite) {
    statusSite.textContent = "Site";
    statusSite.className = "status ok";
  }
}

function setDisconnected() {
  if (driverName) driverName.textContent = "Non connecté";
  if (statusSite) {
    statusSite.textContent = "Site";
    statusSite.className = "status off";
  }
}

function updatePauseUI() {
  if (pauseTitle) pauseTitle.textContent = "Pause en cours";
  if (pauseCountdown) {
    pauseCountdown.textContent = `Temps pause : ${formatPause(pauseSecondsRestants)}`;
  }
  if (pauseStatus) {
    pauseStatus.textContent = "Le camion doit rester à l'arrêt";
  }
}

function startPause() {
  if (pauseActive) return;

  if (conduiteSecondsEffectives < PAUSE_UNLOCK_AFTER_SECONDS) {
    if (pauseTitle) pauseTitle.textContent = "Pause indisponible";
    if (pauseCountdown) pauseCountdown.textContent = "Conduite minimum : 1H00";
    if (pauseStatus) pauseStatus.textContent = "Disponible après 1h de conduite";
    showPauseScreen();
    updateDriveColor();
    return;
  }

  if (!lastParkingBrake) {
    if (pauseTitle) pauseTitle.textContent = "Pause refusée";
    if (pauseCountdown) pauseCountdown.textContent = "Frein de parking requis";
    if (pauseStatus) {
      pauseStatus.textContent = "Active le frein de parking pour démarrer la pause";
    }
    showPauseScreen();
    updateDriveColor();
    return;
  }

  pauseActive = true;
  pauseSecondsRestants = PAUSE_DURATION_SECONDS;
  infractionSeconds = 0;

  updatePauseUI();
  showPauseScreen();
  updateDriveColor();
  saveRuntimeState();
}

function completePause() {
  pauseActive = false;
  pauseSecondsRestants = PAUSE_DURATION_SECONDS;
  conduiteSecondsRestants = DRIVE_TOTAL_SECONDS;
  conduiteSecondsEffectives = 0;
  conduiteCycleStarted = false;
  infractionActive = false;
  infractionSeconds = 0;
  warning15Played = false;
  warning5Played = false;

  if (pauseTitle) pauseTitle.textContent = "Pause terminée";
  if (pauseCountdown) pauseCountdown.textContent = "Temps pause : 10:00";
  if (pauseStatus) {
    pauseStatus.textContent = `Reprise autorisée • Amendes cumulées : ${amendeTotale} €`;
  }

  showDriveScreen();
  updateDriveColor();
  saveRuntimeState();
}

function saveToken(token) {
  try {
    fs.writeFileSync(configPath, JSON.stringify({ token }, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Erreur saveToken :", error);
    return false;
  }
}

function readToken() {
  try {
    if (!fs.existsSync(configPath)) return null;
    const raw = fs.readFileSync(configPath, "utf-8");
    const data = JSON.parse(raw);
    return data.token ?? null;
  } catch (error) {
    console.error("Erreur readToken :", error);
    return null;
  }
}

function postJson(url, body = {}) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);

    const req = https.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        let raw = "";

        res.on("data", (chunk) => {
          raw += chunk;
        });

        res.on("end", () => {
          let data = {};

          try {
            data = raw ? JSON.parse(raw) : {};
          } catch {
            data = { raw };
          }

          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            data,
          });
        });
      }
    );

    req.on("error", (error) => reject(error));
    req.write(payload);
    req.end();
  });
}

async function sendMissionStart(data) {
  if (!currentSteamId) return;
  if (missionState.startSent) return;

  try {
    const res = await postJson(
      "https://elite-routiers.vercel.app/api/client/livraison/start",
      {
        steamId: currentSteamId,
        truck: data.truck,
        cargo: data.cargo,
        sourceCity: data.sourceCity,
        destinationCity: data.destinationCity,
        kmPrevu: data.jobDistanceKm,
        startOdometerKm: data.odometerKm,
      }
    );

    if (res.ok && res.data?.livraisonId) {
      missionState.livraisonId = res.data.livraisonId;
      missionState.startSent = true;
      missionState.endSent = false;
      console.log("🚀 START OK", res.data.livraisonId);
      saveRuntimeState();
    } else {
      console.log("START refusé ou incomplet", res.status, res.data);
    }
  } catch (e) {
    console.error("Erreur START :", e);
  }
}

async function sendMissionEnd(data) {
  if (!currentSteamId) return;
  if (!missionState.livraisonId) return;
  if (missionState.endSent) return;

  try {
    const res = await postJson(
      "https://elite-routiers.vercel.app/api/livraisons/end",
      {
        steamId: currentSteamId,
        livraisonId: missionState.livraisonId,
        endOdometerKm: data.odometerKm,
        income: 0,
        endReason: "job_finished",
        status: "TERMINEE",
      }
    );

    if (res.ok) {
      missionState.endSent = true;
      console.log("🏁 END OK", res.data);
      saveRuntimeState();
    } else {
      console.log("END refusé ou incomplet", res.status, res.data);
    }
  } catch (e) {
    console.error("Erreur END :", e);
  }
}

function updateMissionLocalState(data) {
  const hasMission =
    Boolean(data.missionActive) &&
    Boolean(text(data.sourceCity)) &&
    Boolean(text(data.destinationCity)) &&
    Boolean(text(data.cargo)) &&
    Boolean(text(data.truck));

  if (!missionState.active && hasMission) {
    missionState.active = true;
    missionState.truck = text(data.truck);
    missionState.cargo = text(data.cargo);
    missionState.sourceCity = text(data.sourceCity);
    missionState.destinationCity = text(data.destinationCity);
    missionState.startedAt = new Date().toISOString();
    missionState.endSent = false;

    sendMissionStart({
      truck: data.truck,
      cargo: data.cargo,
      sourceCity: data.sourceCity,
      destinationCity: data.destinationCity,
      jobDistanceKm: data.jobDistanceKm,
      odometerKm: data.odometerKm,
    });
  }

  if (missionState.active && missionState.lastMissionActive && !data.missionActive) {
    sendMissionEnd({
      odometerKm: data.odometerKm,
    });

    missionState.active = false;
  }

  missionState.lastMissionActive = Boolean(data.missionActive);

  if (!data.missionActive && !missionState.active && missionState.endSent) {
    missionState.truck = "";
    missionState.cargo = "";
    missionState.sourceCity = "";
    missionState.destinationCity = "";
    missionState.startedAt = null;
    missionState.lastMissionActive = false;
    missionState.livraisonId = null;
    missionState.startSent = false;
    missionState.endSent = false;
  }
}

function applyStableTelemetry(data) {
  const now = Date.now();

  const speed = Math.max(0, Math.round(num(data.speedKph, stableTelemetry.speedKph)));
  const odometerKm = num(data.odometerKm, stableTelemetry.odometerKm);
  const sourceCity = text(data.sourceCity) || stableTelemetry.sourceCity;
  const destinationCity = text(data.destinationCity) || stableTelemetry.destinationCity;
  const truck = text(data.truck) || stableTelemetry.truck;
  const cargo = text(data.cargo) || stableTelemetry.cargo;
  const remainingKm = Math.max(
    0,
    Math.round(num(data.jobDistanceKm, stableTelemetry.jobDistanceKm))
  );
  const missionActive =
    data.missionActive !== undefined
      ? Boolean(data.missionActive)
      : stableTelemetry.missionActive;

  const parkingBrake =
    data.parkingBrake !== undefined
      ? Boolean(data.parkingBrake)
      : stableTelemetry.parkingBrake;

  stableTelemetry = {
    speedKph: speed,
    odometerKm,
    sourceCity,
    destinationCity,
    truck,
    cargo,
    jobDistanceKm: remainingKm,
    missionActive,
    parkingBrake,
  };

  lastTelemetrySpeed = speed;
  lastMissionDistanceKm = remainingKm;
  lastParkingBrake = parkingBrake;

  lastGameOk = now;

  if (missionActive && (sourceCity || destinationCity)) {
    lastDeliveryOk = now;
  }

  if (truck && truck !== "-") {
    lastTruckOk = now;
  }

  updateMissionLocalState({
    missionActive,
    sourceCity,
    destinationCity,
    cargo,
    truck,
    jobDistanceKm: remainingKm,
    odometerKm,
  });

  updateStatusIndicators();

  if (speedValue) speedValue.textContent = String(speed);
  if (speedTop) speedTop.textContent = `${speed} km/h`;

  const missionLabel =
    sourceCity && destinationCity
      ? `Mission : ${sourceCity} → ${destinationCity}`
      : "Mission : -";

  if (missionText) missionText.textContent = missionLabel;
  if (truckText) truckText.textContent = `Camion : ${truck || "-"}`;
  if (remainingKmText) remainingKmText.textContent = `Km restant : ${remainingKm} km`;

  if (driveTime) {
    driveTime.textContent = `Conduite : ${formatDuration(conduiteSecondsRestants)}`;
  }

  if (homeMission) homeMission.textContent = missionLabel;
  if (homeTruck) homeTruck.textContent = `Camion : ${truck || "-"}`;

  if (homeMessage) {
    if (infractionActive) {
      homeMessage.textContent = `Infraction • Amendes : ${amendeTotale} €`;
    } else if (pauseActive) {
      homeMessage.textContent = "Pause en cours";
    } else if (missionActive) {
      homeMessage.textContent = "Mission en cours";
    } else {
      homeMessage.textContent = "Tacky prêt";
    }
  }

  updateDriveColor();
}

function applyOfflineState() {
  updateStatusIndicators();

  if (speedValue) speedValue.textContent = String(Math.round(stableTelemetry.speedKph || 0));
  if (speedTop) speedTop.textContent = `${Math.round(stableTelemetry.speedKph || 0)} km/h`;

  if (missionText) {
    missionText.textContent =
      stableTelemetry.sourceCity && stableTelemetry.destinationCity
        ? `Mission : ${stableTelemetry.sourceCity} → ${stableTelemetry.destinationCity}`
        : "Mission : -";
  }

  if (truckText) {
    truckText.textContent = `Camion : ${stableTelemetry.truck || "-"}`;
  }

  if (remainingKmText) {
    remainingKmText.textContent = `Km restant : ${Math.round(stableTelemetry.jobDistanceKm || 0)} km`;
  }

  if (driveTime) {
    driveTime.textContent = `Conduite : ${formatDuration(conduiteSecondsRestants)}`;
  }

  updateDriveColor();
}

function readTelemetry() {
  try {
    if (!fs.existsSync(telemetryPath)) {
      applyOfflineState();
      return;
    }

    const raw = fs.readFileSync(telemetryPath, "utf-8");
    if (!raw || !raw.trim()) {
      applyOfflineState();
      return;
    }

    const data = JSON.parse(raw);
    applyStableTelemetry(data);
  } catch (error) {
    console.error("Erreur lecture telemetry :", error);
    applyOfflineState();
  }
}

function tickConduite() {
  const gameDetectedRecently = Date.now() - lastGameOk < STATUS_DELAY_MS;

  if (!gameDetectedRecently) {
    if (driveTime) {
      driveTime.textContent = `Conduite : ${formatDuration(conduiteSecondsRestants)}`;
    }
    updateDriveColor();
    return;
  }

  if (pauseActive) {
    if (!lastParkingBrake || lastTelemetrySpeed > 0) {
      pauseActive = false;

      if (pauseTitle) pauseTitle.textContent = "Pause interrompue";
      if (pauseCountdown) {
        pauseCountdown.textContent = `Temps restant : ${formatPause(pauseSecondsRestants)}`;
      }
      if (pauseStatus) {
        pauseStatus.textContent = "Reprends 10 min complètes pour valider la pause";
      }

      if (conduiteSecondsRestants <= 0) {
        infractionActive = true;
        infractionSeconds = 0;
      }

      showDriveScreen();
      updateDriveColor();
      saveRuntimeState();
      return;
    }

    if (pauseSecondsRestants > 0) {
      pauseSecondsRestants -= 1;
    }

    updatePauseUI();

    if (pauseSecondsRestants <= 0) {
      completePause();
    } else {
      saveRuntimeState();
    }

    updateDriveColor();
    return;
  }

  if (!conduiteCycleStarted && lastTelemetrySpeed > 0) {
    conduiteCycleStarted = true;
  }

  if (conduiteCycleStarted && conduiteSecondsRestants > 0) {
    conduiteSecondsRestants -= 1;
    conduiteSecondsEffectives += 1;
  }

  if (!warning15Played && conduiteSecondsRestants === WARNING_15_MIN_SECONDS) {
    warning15Played = true;
    play15MinBeep();
  }

  if (!warning5Played && conduiteSecondsRestants === WARNING_5_MIN_SECONDS) {
    warning5Played = true;
    play5MinBeep();
  }

  if (conduiteSecondsRestants <= 0) {
    conduiteSecondsRestants = 0;
    infractionActive = true;
  }

  if (infractionActive && !pauseActive) {
    infractionSeconds += 1;

    if (infractionSeconds % INFRACTION_FINE_EVERY_SECONDS === 0) {
      amendeTotale += INFRACTION_FINE_AMOUNT;
      playInfractionBeep();
    }
  }

  if (driveTime) {
    driveTime.textContent = `Conduite : ${formatDuration(conduiteSecondsRestants)}`;
  }

  if (remainingKmText) {
    remainingKmText.textContent = `Km restant : ${Math.round(lastMissionDistanceKm)} km`;
  }

  if (infractionActive) {
    if (etat) {
      etat.textContent = `État : Infraction • ${amendeTotale} €`;
    }
    if (homeMessage) {
      homeMessage.textContent = `Infraction • Amendes : ${amendeTotale} €`;
    }
  } else if (currentMode === "drive") {
    if (etat) etat.textContent = "État : Conduite";

    if (homeMessage) {
      if (pauseActive) {
        homeMessage.textContent = "Pause en cours";
      } else if (stableTelemetry.missionActive) {
        homeMessage.textContent = "Mission en cours";
      } else {
        homeMessage.textContent = "Tacky prêt";
      }
    }
  }

  updateDriveColor();
  saveRuntimeState();
}

async function checkSavedToken() {
  const token = readToken();

  if (!token) {
    currentSteamId = null;
    setDisconnected();
    return;
  }

  try {
    const result = await postJson(
      "https://elite-routiers.vercel.app/api/tacky/check",
      { token }
    );

    if (result.ok && result.data.valid) {
      currentSteamId = result.data.user?.steamId || null;
      setConnected(result.data.user?.pseudo || "Connecté");
    } else {
      currentSteamId = null;
      setDisconnected();
    }
  } catch (error) {
    console.error("Erreur checkSavedToken :", error);
    currentSteamId = null;
    setDisconnected();
  }
}

if (connectBtn) {
  connectBtn.addEventListener("click", async () => {
    try {
      const result = await postJson(
        "https://elite-routiers.vercel.app/api/tacky/start",
        { deviceName: "Tacky PC" }
      );

      if (!result.ok) {
        alert(result.data?.error || `Erreur start (${result.status})`);
        return;
      }

      const requestId = result.data?.requestId;
      const connectUrl = result.data?.connectUrl;

      if (!requestId || !connectUrl) {
        alert("Réponse invalide du serveur");
        return;
      }

      await shell.openExternal(connectUrl);

      const interval = setInterval(async () => {
        try {
          const pollResult = await postJson(
            "https://elite-routiers.vercel.app/api/tacky/poll",
            { requestId }
          );

          if (pollResult.ok && pollResult.data.linked && pollResult.data.token) {
            clearInterval(interval);

            const saved = saveToken(pollResult.data.token);

            if (!saved) {
              alert("Connexion OK, mais impossible de sauvegarder le token");
              return;
            }

            currentSteamId = pollResult.data.user?.steamId || null;
            setConnected(pollResult.data.user?.pseudo || "Connecté");
            alert("Tacky connecté avec succès");
          }
        } catch (error) {
          console.error("Erreur polling :", error);
        }
      }, 2000);
    } catch (error) {
      console.error("Erreur startConnection :", error);
      alert(`Impossible de contacter le site : ${error.message}`);
    }
  });
}

if (btnHome) {
  btnHome.addEventListener("click", () => {
    if (pauseActive) return;
    showHomeScreen();
    updateDriveColor();
  });
}

if (btnDrive) {
  btnDrive.addEventListener("click", () => {
    if (pauseActive) return;
    showDriveScreen();
    updateDriveColor();
  });
}

if (btnPause) {
  btnPause.addEventListener("click", () => {
    startPause();
  });
}

window.addEventListener("beforeunload", () => {
  saveRuntimeState();
});

applyLoadedState();

checkSavedToken();
readTelemetry();
setInterval(readTelemetry, 500);
setInterval(tickConduite, 1000);

if (pauseActive) {
  showPauseScreen();
  updatePauseUI();
} else {
  showDriveScreen();
}

updateDriveColor();
updateStatusIndicators();
saveRuntimeState();