import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  LayoutGrid,
  CalendarDays,
  Settings,
  Plus,
  Search,
  ChevronDown,
  ArrowUpRight,
  MoreHorizontal,
  Video,
  Instagram,
  Check,
  Clock,
  Lightbulb,
  X,
  LogOut,
  ArrowRight,
  Clapperboard,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Link,
  CheckCircle2,
  Menu,
  Folder,
  Copy,
  Trash2,
  Send,
} from "lucide-react";
import "./style.css";
const statuses = [
  "Idee",
  "Wird umgesetzt",
  "Abgelehnt",
  "In Bearbeitung",
  "In Planung",
  "Fertig (auf Upload warten)",
  "Fertig (Hochgeladen)",
];
const statusNames = [
  "Idee",
  "Wird umgesetzt",
  "Abgelehnt",
  "In Bearbeitung",
  "In Planung",
  "Bereit für Upload",
  "Hochgeladen",
];
const colors = ["purple", "blue", "red", "orange", "cyan", "purple", "green"];
async function api(url, options = {}) {
  const response = await fetch("/api" + url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const body = await response
    .json()
    .catch(() => ({ error: "Anfrage fehlgeschlagen." }));
  if (!response.ok) throw Error(body.error || "Anfrage fehlgeschlagen.");
  return body;
}
const blank = () => ({
  id: crypto.randomUUID(),
  title: "",
  description: "",
  category: "",
  platform: "Instagram",
  format: "Reel",
  status: "Idee",
  date: "",
  goal: "Reichweite aufbauen",
  audience: "",
  hook: "Problem & Lösung",
  cta: "Für mehr Tipps folgen",
  script: "",
});
function Badge({ status }) {
  const i = statuses.indexOf(status);
  return (
    <span className={"badge " + colors[i]}>
      <i />
      {statusNames[i]}
    </span>
  );
}
function App() {
  const [user, setUser] = useState(null),
    [checking, setChecking] = useState(true),
    [tasks, setTasks] = useState([]),
    [view, setView] = useState("board"),
    [category, setCategory] = useState("Alle Inhalte"),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("Alle Status"),
    [editing, setEditing] = useState(null),
    [toast, setToast] = useState(""),
    [connected, setConnected] = useState(false),
    [mobile, setMobile] = useState(false);
  function notify(t) {
    setToast(t);
    setTimeout(() => setToast(""), 6500);
  }
  useEffect(() => {
    api("/me")
      .then(setUser)
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);
  useEffect(() => {
    if (user) {
      api("/tasks")
        .then(setTasks)
        .catch((e) => notify(e.message));
      api("/settings")
        .then((s) => setConnected(s.connected))
        .catch((e) => notify(e.message));
    }
  }, [user]);
  if (checking)
    return (
      <div className="loading">
        <Sparkles /> Studio wird geladen…
      </div>
    );
  if (!user) return <Auth onLogin={setUser} />;
  const categories = [...new Set(tasks.map((t) => t.category).filter(Boolean))];
  const filtered = tasks.filter(
    (t) =>
      (category === "Alle Inhalte" || t.category === category) &&
      (filter === "Alle Status" || t.status === filter) &&
      (t.title + " " + t.description + " " + t.category)
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const planned = tasks.filter((t) => t.status === "In Planung").length;
  const done = tasks.filter((t) => t.status === "Fertig (Hochgeladen)").length;
  async function save(t) {
    const result = await api("/tasks/" + t.id, {
      method: "PUT",
      body: JSON.stringify(t),
    });
    setTasks((prev) => [result.task, ...prev.filter((x) => x.id !== t.id)]);
    setEditing(null);
    notify(
      result.discordError ||
        "Aufgabe gespeichert" +
          (result.discord === "Synchronisiert"
            ? " · Discord aktualisiert"
            : ""),
    );
  }
  return (
    <div className="app">
      <aside className={mobile ? "sidebar open" : "sidebar"}>
        <a className="brand" href="#" onClick={(e) => e.preventDefault()}>
          <span className="brand-icon">
            <Clapperboard size={22} />
          </span>
          studio<span className="brand-dot">.</span>
        </a>
        <div className="workspace">
          <span className="workspace-avatar">M</span>
          <div>
            <strong>Mein Workspace</strong>
            <small>Marketing Studio</small>
          </div>
          <ChevronDown size={15} />
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {[
            ["board", LayoutGrid, "Content Board"],
            ["calendar", CalendarDays, "Kalender"],
          ].map(([id, Icon, label]) => (
            <button
              className={view === id ? "nav-item active" : "nav-item"}
              key={id}
              onClick={() => {
                setView(id);
                setMobile(false);
              }}
            >
              <Icon size={19} />
              {label}
              {id === "board" && (
                <span className="nav-count">{tasks.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="nav-label campaign-label">
          KAMPAGNEN{" "}
          <button
            title="Kampagne anlegen"
            onClick={() =>
              setEditing({ ...blank(), category: "Neue Kampagne" })
            }
          >
            <Plus size={16} />
          </button>
        </div>
        <button
          className={
            "category-link " + (category === "Alle Inhalte" ? "chosen" : "")
          }
          onClick={() => {
            setCategory("Alle Inhalte");
            setView("board");
          }}
        >
          <span className="category-dot all" />
          Alle Inhalte
        </button>
        {categories.map((c, i) => (
          <button
            key={c}
            className={"category-link " + (category === c ? "chosen" : "")}
            onClick={() => {
              setCategory(c);
              setView("board");
            }}
          >
            <span className={"category-dot dot" + (i % 4)} />
            {c}
            <span>{tasks.filter((t) => t.category === c).length}</span>
          </button>
        ))}
        {!categories.length && (
          <p className="category-hint">
            Organisiere deine Inhalte in eigenen Kampagnen.
          </p>
        )}
        <div className="sidebar-bottom">
          <div className="discord-promo">
            <span className="discord-symbol">◒</span>
            <strong>Gute Ideen. Im Team.</strong>
            <p>Deine Content-Planung direkt in deinem Discord.</p>
            <button onClick={() => setView("settings")}>
              {connected ? "Verbindung verwalten" : "Discord verbinden"}
              <ArrowUpRight size={15} />
            </button>
          </div>
          <button
            className={"nav-item " + (view === "settings" ? "active" : "")}
            onClick={() => setView("settings")}
          >
            <Settings size={18} />
            Einstellungen
          </button>
          <div className="profile">
            <span className="user-avatar">{user.email[0].toUpperCase()}</span>
            <div>
              <strong>Mein Account</strong>
              <small>{user.email}</small>
            </div>
            <button
              title="Abmelden"
              onClick={async () => {
                await api("/logout", { method: "POST" });
                setUser(null);
                setTasks([]);
              }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobile(!mobile)}>
            <Menu size={21} />
          </button>
          <div className="breadcrumb">
            Workspace <span>/</span>
            <strong>
              {view === "board"
                ? "Content Board"
                : view === "calendar"
                  ? "Kalender"
                  : "Einstellungen"}
            </strong>
          </div>
          <div className="topbar-right">
            <span className="live-dot" />
            Dein kreativer Workspace
            <span className="top-avatar">{user.email[0].toUpperCase()}</span>
          </div>
        </header>
        <div className="main-content">
          {view === "settings" ? (
            <SettingsPage
              connected={connected}
              setConnected={setConnected}
              notify={notify}
            />
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">WENIGER CHAOS. MEHR CONTENT.</div>
                  <h1>
                    {view === "calendar"
                      ? "Dein Content-Kalender"
                      : category === "Alle Inhalte"
                        ? "Deine nächste große Idee."
                        : category}
                    <span className="heading-dot">✳︎</span>
                  </h1>
                  <p>
                    Von der ersten Idee bis zum Upload. Hier wird dein Content
                    lebendig.
                  </p>
                </div>
                <button className="primary" onClick={() => setEditing(blank())}>
                  <Plus size={18} />
                  Neue Aufgabe
                </button>
              </div>
              <div className="stats">
                <Stat
                  icon={LayoutGrid}
                  color="purple"
                  label="Inhalte insgesamt"
                  value={tasks.length}
                  note="Dein kreativer Überblick"
                />
                <Stat
                  icon={Lightbulb}
                  color="orange"
                  label="Neue Ideen"
                  value={tasks.filter((t) => t.status === "Idee").length}
                  note="Bereit, groß zu werden"
                />
                <Stat
                  icon={CalendarDays}
                  color="blue"
                  label="In Planung"
                  value={planned}
                  note="Alles zu seiner Zeit"
                />
                <Stat
                  icon={CheckCircle2}
                  color="green"
                  label="Veröffentlicht"
                  value={done}
                  note="Draußen in der Welt"
                />
              </div>
              <div className="content-toolbar">
                <div className="view-tabs">
                  <button
                    className={view === "board" ? "selected" : ""}
                    onClick={() => setView("board")}
                  >
                    <LayoutGrid size={16} />
                    Board
                  </button>
                  <button
                    className={view === "calendar" ? "selected" : ""}
                    onClick={() => setView("calendar")}
                  >
                    <CalendarDays size={16} />
                    Kalender
                  </button>
                </div>
                <div className="filters">
                  <div className="search">
                    <Search size={16} />
                    <input
                      placeholder="Inhalte durchsuchen…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <select
                    aria-label="Nach Status filtern"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option>Alle Status</option>
                    {statuses.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              {view === "calendar" ? (
                <Calendar
                  tasks={filtered}
                  onEdit={setEditing}
                  onNew={(date) =>
                    setEditing({
                      ...blank(),
                      date: date + "T10:00",
                      status: "In Planung",
                    })
                  }
                />
              ) : (
                <>
                  <div className="section-title">
                    <h2>
                      {category} <span>{filtered.length}</span>
                    </h2>
                    <span>Jede große Geschichte beginnt mit einer Idee.</span>
                  </div>
                  <div className="card-grid">
                    {filtered.map((t, i) => (
                      <TaskCard
                        key={t.id}
                        task={t}
                        index={i}
                        onClick={() => setEditing(t)}
                      />
                    ))}
                    <button
                      className="add-card"
                      onClick={() =>
                        setEditing({
                          ...blank(),
                          category: category === "Alle Inhalte" ? "" : category,
                        })
                      }
                    >
                      <span>
                        <Plus size={23} />
                      </span>
                      <strong>Platz für deine nächste Idee</strong>
                      <small>Neue Aufgabe erstellen</small>
                    </button>
                  </div>
                  {!tasks.length && (
                    <div className="starter">
                      <div className="starter-icon">
                        <Sparkles size={22} />
                      </div>
                      <div>
                        <h3>Große Ideen brauchen einen Anfang.</h3>
                        <p>
                          Erstelle deine erste Aufgabe, wähle eine Kampagne und
                          entwickle mit dem Script-Assistenten deinen nächsten
                          Content.
                        </p>
                      </div>
                      <button onClick={() => setEditing(blank())}>
                        Loslegen <ArrowRight size={17} />
                      </button>
                    </div>
                  )}
                  <div className="board-footer">
                    <span>
                      <span className="live-dot" />
                      Alles an einem Ort. Raum für deine Ideen.
                    </span>
                    <span>
                      Made for your next big thing <Sparkles size={13} />
                    </span>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>
      {editing && (
        <Editor
          task={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSave={save}
          onDelete={async () => {
            const r = await api("/tasks/" + editing.id, { method: "DELETE" });
            setTasks(tasks.filter((t) => t.id !== editing.id));
            setEditing(null);
            notify(r.warning || "Aufgabe gelöscht");
          }}
          existing={tasks.some((t) => t.id === editing.id)}
        />
      )}{" "}
      {toast && (
        <div role="status" className="toast">
          <CheckCircle2 size={18} />
          {toast}
          <button onClick={() => setToast("")}>
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
function Stat({ icon: Icon, color, label, value, note }) {
  return (
    <div className="stat">
      <div className="stat-top">
        <span>{label}</span>
        <span className={"stat-icon " + color}>
          <Icon size={17} />
        </span>
      </div>
      <strong>{String(value).padStart(2, "0")}</strong>
      <small>{note}</small>
    </div>
  );
}
function TaskCard({ task: t, index, onClick }) {
  return (
    <button className="task-card" onClick={onClick}>
      <div className={"card-art art" + (index % 5)}>
        <div className="art-grain" />
        <div className="art-label">
          {t.format === "Reel"
            ? "MAKE IT"
            : t.format === "Story"
              ? "TELL YOUR"
              : "CREATE"}
          <br />
          <em>{t.format === "Story" ? "STORY." : "HAPPEN."}</em>
        </div>
        <span className="art-circle" />
        <span className="format-chip">
          <Video size={12} />
          {t.format}
        </span>
        <span className="art-star">✳︎</span>
      </div>
      <div className="card-body">
        <div className="card-category">
          <span>{t.category || "OHNE KAMPAGNE"}</span>
          <MoreHorizontal size={18} />
        </div>
        <h3>{t.title}</h3>
        <p>
          {t.description || "Eine gute Idee wartet darauf, erzählt zu werden."}
        </p>
        <Badge status={t.status} />
        <div className="card-bottom">
          <span>
            <CalendarDays size={14} />
            {t.date
              ? new Date(t.date).toLocaleDateString("de-DE", {
                  day: "numeric",
                  month: "short",
                })
              : "Noch kein Termin"}
          </span>
          <span className="platform">
            {t.platform === "Instagram" ? (
              <Instagram size={14} />
            ) : (
              <Video size={14} />
            )}{" "}
            {t.platform}
          </span>
        </div>
      </div>
    </button>
  );
}
function Auth({ onLogin }) {
  const [register, setRegister] = useState(false),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <div className="auth">
      <div className="auth-story">
        <a className="brand">
          <span className="brand-icon">
            <Clapperboard />
          </span>
          studio.
        </a>
        <div>
          <span className="eyebrow">DEIN RAUM FÜR GROSSE IDEEN</span>
          <h1>
            Guter Content.
            <br />
            Beginnt mit
            <br />
            <em>einem Plan.</em>
          </h1>
          <p>
            Ideen sammeln. Geschichten entwickeln.
            <br />
            Gemeinsam sichtbar werden.
          </p>
          <div className="auth-tags">
            <span>
              <Lightbulb size={16} />
              Idee
            </span>
            <ArrowRight size={18} />
            <span>
              <Clapperboard size={16} />
              Content
            </span>
            <ArrowRight size={18} />
            <span>
              <Sparkles size={16} />
              Wirkung
            </span>
          </div>
        </div>
        <small>Dein Marketing. Dein Rhythmus. Dein Studio.</small>
      </div>
      <div className="auth-form">
        <div className="auth-box">
          <span className="eyebrow">LET’S MAKE SOMETHING GREAT</span>
          <h2>{register ? "Dein Studio wartet." : "Willkommen zurück."}</h2>
          <p>
            {register
              ? "Erstelle deinen persönlichen Marketing-Workspace."
              : "Melde dich an und bring deine Ideen auf den Weg."}
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                onLogin(
                  await api("/auth/" + (register ? "register" : "login"), {
                    method: "POST",
                    body: JSON.stringify({ email, password }),
                  }),
                );
              } catch (e) {
                setError(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              E-Mail-Adresse
              <input
                type="email"
                autoComplete="email"
                value={email}
                required
                placeholder="du@unternehmen.de"
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Passwort
              <input
                type="password"
                minLength={12}
                maxLength={256}
                required
                autoComplete={register ? "new-password" : "current-password"}
                placeholder="Mindestens 12 Zeichen"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="primary" disabled={busy}>
              {busy
                ? "Einen Moment…"
                : register
                  ? "Account erstellen"
                  : "Anmelden"}
              <ArrowRight size={18} />
            </button>
          </form>
          <p className="auth-switch">
            {register ? "Schon einen Account?" : "Neu bei Studio?"}{" "}
            <button
              onClick={() => {
                setRegister(!register);
                setError("");
              }}
            >
              {register ? "Jetzt anmelden" : "Account erstellen"}
            </button>
          </p>
          <div className="secure-note">
            <CheckCircle2 size={14} />
            Deine Inhalte sind nur für dich sichtbar.
          </div>
        </div>
      </div>
    </div>
  );
}
function Editor({ task, categories, onClose, onSave, onDelete, existing }) {
  useEffect(() => {
    const previous = document.activeElement;
    function keys(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const els = [
          ...document.querySelectorAll(
            ".editor button:not([disabled]),.editor input,.editor select,.editor textarea",
          ),
        ].filter((el) => el.offsetParent !== null);
        const first = els[0],
          last = els.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", keys);
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", keys);
      document.body.style.overflow = old;
      previous?.focus();
    };
  }, []);
  const [t, setT] = useState({ ...task }),
    [tab, setTab] = useState("details"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [confirm, setConfirm] = useState(false);
  const field = (key, value) => setT((prev) => ({ ...prev, [key]: value }));
  const select = (key, label, options) => (
    <label>
      {label}
      <select
        aria-label={label}
        value={t[key]}
        onChange={(e) => field(key, e.target.value)}
      >
        {options.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
    </label>
  );
  function generate() {
    const hooks = {
      "Problem & Lösung": `Kennst du das: ${t.audience || "deine Zielgruppe"} möchte ${t.goal.toLowerCase()}, aber weiß nicht, wo anfangen?`,
      "Überraschender Fakt": `Die meisten unterschätzen diesen einen Punkt bei „${t.title || "diesem Thema"}“.`,
      "Vorher & Nachher": `Von der ersten Herausforderung zum sichtbaren Ergebnis – so geht’s bei „${t.title || "deinem Thema"}“.`,
      "3 schnelle Tipps": `Drei Tipps zu „${t.title || "deinem Thema"}“, die du heute noch umsetzen kannst.`,
    };
    field(
      "script",
      `HOOK · 0–3 SEKUNDEN\n${hooks[t.hook]}\n[Zeige ein starkes Bild und blende die Kernaussage als Text ein.]\n\nPROBLEM · 3–8 SEKUNDEN\n${t.description || "[Beschreibe ein konkretes Problem deiner Zielgruppe in einem Satz.]"}\n\nMEHRWERT · 8–25 SEKUNDEN\n1. [Zeige einen konkreten, sofort umsetzbaren Schritt.]\n2. [Erkläre den Nutzen anhand eines Beispiels.]\n3. [Gib einen zusätzlichen Tipp, der einen häufigen Fehler vermeidet.]\n\nBEWEIS · 25–35 SEKUNDEN\n[Ergänze ein echtes Ergebnis, eine Demonstration oder eine Kundenstimme. Keine unbelegten Versprechen.]\n\nCALL TO ACTION · 35–40 SEKUNDEN\n${t.cta}.\n[Blende die Handlungsaufforderung ein und halte das Schlussbild kurz stehen.]`,
    );
  }
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="editor"
        role="dialog"
        aria-modal="true"
        aria-label="Aufgabe bearbeiten"
      >
        <div className="editor-header">
          <div>
            <span className="eyebrow">CONTENT STUDIO</span>
            <h2>
              {existing ? "Deine Idee, im Detail." : "Eine neue Idee beginnt."}
            </h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Schließen"
          >
            <X />
          </button>
        </div>
        <div className="editor-tabs">
          <button
            className={tab === "details" ? "selected" : ""}
            onClick={() => setTab("details")}
          >
            <LayoutGrid size={16} />
            Aufgabe & Planung
          </button>
          <button
            className={tab === "script" ? "selected" : ""}
            onClick={() => setTab("script")}
          >
            <Sparkles size={16} />
            Script-Assistent
          </button>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!t.title.trim()) {
              setTab("details");
              setError("Bitte gib deiner Aufgabe einen Titel.");
              return;
            }
            if (t.status === "In Planung" && !t.date) {
              setTab("details");
              setError("Bitte lege einen Termin fest.");
              return;
            }
            setBusy(true);
            setError("");
            try {
              await onSave(t);
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="editor-scroll">
            {tab === "details" ? (
              <>
                <label>
                  Titel deiner Idee
                  <input
                    autoFocus
                    placeholder="Was möchtest du erzählen?"
                    maxLength={200}
                    value={t.title}
                    onChange={(e) => field("title", e.target.value)}
                  />
                </label>
                <label>
                  Beschreibung
                  <textarea
                    rows={3}
                    placeholder="Worum geht es? Was soll dein Content bewirken?"
                    value={t.description}
                    onChange={(e) => field("description", e.target.value)}
                  />
                </label>
                <label>
                  Kampagne / Übermenü
                  <input
                    list="campaigns"
                    placeholder="z. B. Produktlaunch, Behind the Scenes…"
                    value={t.category}
                    onChange={(e) => field("category", e.target.value)}
                  />
                  <datalist id="campaigns">
                    {categories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </datalist>
                </label>
                <div className="form-row">
                  {select("platform", "Plattform", [
                    "Instagram",
                    "TikTok",
                    "YouTube",
                    "LinkedIn",
                    "Facebook",
                  ])}
                  {select("format", "Format", [
                    "Reel",
                    "Story",
                    "Short",
                    "Video",
                    "Carousel",
                    "Beitrag",
                  ])}
                </div>
                <div className="form-row">
                  {select("status", "Status", statuses)}
                  <label>
                    Veröffentlichungstermin
                    {t.status === "In Planung" ? " *" : ""}
                    <input
                      type="datetime-local"
                      value={t.date}
                      onChange={(e) => field("date", e.target.value)}
                    />
                  </label>
                </div>
                <div className="hint">
                  <CalendarDays size={18} />
                  <p>
                    Mit „In Planung“ wird ein Termin verpflichtend. Dein Content
                    erscheint automatisch im Kalender.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="script-intro">
                  <span className="stat-icon purple">
                    <Sparkles size={20} />
                  </span>
                  <div>
                    <h3>Aus einer Idee wird eine Geschichte.</h3>
                    <p>
                      Wähle deine Richtung. Wir geben deinem Script Struktur.
                    </p>
                  </div>
                </div>
                <div className="form-row">
                  {select("goal", "Was ist dein Ziel?", [
                    "Reichweite aufbauen",
                    "Vertrauen stärken",
                    "Produkt erklären",
                    "Leads gewinnen",
                    "Community aktivieren",
                  ])}
                  {select("hook", "Wie möchtest du starten?", [
                    "Problem & Lösung",
                    "Überraschender Fakt",
                    "Vorher & Nachher",
                    "3 schnelle Tipps",
                  ])}
                </div>
                <label>
                  Für wen ist der Content?
                  <input
                    placeholder="z. B. Gründer, die ihr Marketing selbst machen"
                    value={t.audience}
                    onChange={(e) => field("audience", e.target.value)}
                  />
                </label>
                {select("cta", "Was soll danach passieren?", [
                  "Für mehr Tipps folgen",
                  "Beitrag speichern",
                  "Eigene Erfahrung kommentieren",
                  "Link in der Bio besuchen",
                  "Nachricht senden",
                  "Mit dem Team teilen",
                ])}
                <button type="button" className="generate" onClick={generate}>
                  <Sparkles size={17} />
                  {t.script
                    ? "Script-Vorlage neu erstellen"
                    : "Script-Vorlage erstellen"}
                </button>
                <small className="template-note">
                  Strukturierte Vorlage ohne externe KI. Ersetze Platzhalter
                  durch deine eigenen Beispiele.
                </small>
                <label>
                  Dein Videoscript
                  <textarea
                    className="script-text"
                    rows={14}
                    placeholder="Deine Geschichte beginnt hier…"
                    value={t.script}
                    onChange={(e) => field("script", e.target.value)}
                  />
                </label>
                {t.script && (
                  <button
                    type="button"
                    className="text-button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(t.script);
                        setError("Script kopiert.");
                      } catch {
                        setError(
                          "Kopieren nicht möglich. Markiere den Text manuell.",
                        );
                      }
                    }}
                  >
                    <Copy size={14} />
                    Script kopieren
                  </button>
                )}
              </>
            )}
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
          </div>
          <footer className="editor-footer">
            {existing ? (
              <button
                type="button"
                className="delete"
                disabled={busy}
                onClick={async () => {
                  if (!confirm) {
                    setConfirm(true);
                    return;
                  }
                  setBusy(true);
                  try {
                    await onDelete();
                  } catch (e) {
                    setError(e.message);
                    setBusy(false);
                  }
                }}
              >
                <Trash2 size={16} />
                {confirm ? "Wirklich löschen?" : "Löschen"}
              </button>
            ) : (
              <span />
            )}
            <div>
              <button type="button" className="secondary" onClick={onClose}>
                Abbrechen
              </button>
              <button className="primary" disabled={busy}>
                <Check size={16} />
                {busy ? "Wird gespeichert…" : "Aufgabe speichern"}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
}
function SettingsPage({ connected, setConnected, notify }) {
  const [url, setUrl] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">ALLES GUT VERBUNDEN</div>
          <h1>
            Einstellungen<span className="heading-dot">✳︎</span>
          </h1>
          <p>Dein Workspace. Deine Verbindungen.</p>
        </div>
      </div>
      <section className="settings-card">
        <div className="settings-title">
          <span className="discord-logo">◒</span>
          <div>
            <h2>Discord-Integration</h2>
            <p>Bring deine Content-Planung dorthin, wo dein Team ist.</p>
          </div>
          <span className={"badge " + (connected ? "green" : "gray")}>
            <i />
            {connected ? "Verbunden" : "Nicht verbunden"}
          </span>
        </div>
        <div className="steps">
          <p>
            <b>01</b>Öffne in Discord die Kanaleinstellungen → Integrationen →
            Webhooks.
          </p>
          <p>
            <b>02</b>Erstelle einen Webhook und kopiere die Webhook-URL.
          </p>
          <p>
            <b>03</b>Füge die URL hier ein. Neue und bearbeitete Aufgaben werden
            synchronisiert.
          </p>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              const r = await api("/settings", {
                method: "PUT",
                body: JSON.stringify({ webhook: url }),
              });
              setConnected(r.connected);
              setUrl("");
              notify("Discord-Verbindung gespeichert.");
            } catch (e) {
              notify(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Discord Webhook-URL
            <input
              type="password"
              autoComplete="off"
              placeholder={
                connected
                  ? "Neue Webhook-URL zum Ersetzen einfügen"
                  : "https://discord.com/api/webhooks/…"
              }
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </label>
          <div className="settings-actions">
            <button className="primary" disabled={busy}>
              <Link size={16} />
              {busy ? "Speichern…" : "Verbindung speichern"}
            </button>
            {connected && (
              <>
                <button
                  type="button"
                  className="secondary"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      const r = await api("/discord/sync", { method: "POST" });
                      notify(
                        `${r.total - r.failed} von ${r.total} Aufgaben synchronisiert.`,
                      );
                    } catch (e) {
                      notify(e.message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <Send size={15} />
                  Alle synchronisieren
                </button>
                <button
                  type="button"
                  className="text-button"
                  disabled={busy}
                  onClick={async () => {
                    try {
                      await api("/settings", {
                        method: "PUT",
                        body: JSON.stringify({ webhook: "" }),
                      });
                      setConnected(false);
                      notify(
                        "Verbindung getrennt. Bestehende Discord-Nachrichten bleiben erhalten.",
                      );
                    } catch (e) {
                      notify(e.message);
                    }
                  }}
                >
                  Trennen
                </button>
              </>
            )}
          </div>
        </form>
        <div className="hint">
          <CheckCircle2 size={19} />
          <p>
            Jede Aufgabe erhält eine farbige Discord-Nachricht. Änderungen
            aktualisieren dieselbe Nachricht. Die Webhook-URL bleibt auf dem
            Server und wird nicht an den Browser zurückgegeben. Beim Wechsel des
            Webhooks bleiben alte Nachrichten im ursprünglichen Kanal.
          </p>
        </div>
      </section>
    </>
  );
}
function Calendar({ tasks, onEdit, onNew }) {
  const [month, setMonth] = useState(new Date());
  const year = month.getFullYear(),
    m = month.getMonth();
  const offset = (new Date(year, m, 1).getDay() + 6) % 7;
  const days = new Date(year, m + 1, 0).getDate();
  return (
    <div className="calendar">
      <div className="calendar-title">
        <h2>
          {month.toLocaleDateString("de-DE", {
            month: "long",
            year: "numeric",
          })}
        </h2>
        <div>
          <button
            aria-label="Vorheriger Monat"
            onClick={() => setMonth(new Date(year, m - 1, 1))}
          >
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => setMonth(new Date())}>Heute</button>
          <button
            aria-label="Nächster Monat"
            onClick={() => setMonth(new Date(year, m + 1, 1))}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="calendar-grid">
        {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => (
          <div key={d} className="day-label">
            {d}
          </div>
        ))}
        {Array.from({ length: Math.ceil((offset + days) / 7) * 7 }, (_, i) => {
          const day = i - offset + 1;
          const date = `${year}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          return (
            <div
              key={i}
              className={"day " + (day < 1 || day > days ? "outside" : "")}
            >
              {day > 0 && day <= days && (
                <>
                  <button
                    className={
                      "day-number " +
                      (date === new Date().toLocaleDateString("en-CA")
                        ? "today"
                        : "")
                    }
                    onClick={() => onNew(date)}
                    title="Aufgabe an diesem Tag erstellen"
                  >
                    {day}
                    <Plus size={12} />
                  </button>
                  {tasks
                    .filter((t) => t.date.startsWith(date))
                    .map((t) => (
                      <button
                        key={t.id}
                        className={
                          "calendar-task " + colors[statuses.indexOf(t.status)]
                        }
                        onClick={() => onEdit(t)}
                      >
                        {t.date.slice(11, 16)} · {t.title}
                      </button>
                    ))}
                </>
              )}
            </div>
          );
        })}
      </div>
      <small className="calendar-note">
        Klicke auf einen Tag, um Content zu planen. Aufgaben ohne Termin findest
        du im Board.
      </small>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
