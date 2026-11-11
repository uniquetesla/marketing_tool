import { buildRpScript, rpTypes, rpGoals, rpCtas } from "./rp-script.js";
import { CampaignDelete } from "./collaboration.jsx";
import {
  ProfileColor,
  SpacesPanel,
  MediaLibrary,
  StatusDialog,
} from "./collaboration.jsx";
import { Users, Image as ImageIcon } from "lucide-react";
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
import "./trello.css";
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
  "Abgeschlossen",
];
const colors = ["purple", "blue", "red", "orange", "cyan", "purple", "green"];
const boardStatuses = [
  statuses[0],
  statuses[4],
  statuses[1],
  statuses[3],
  statuses[5],
  statuses[6],
  statuses[2],
];
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
  goal: "Neue Spieler gewinnen",
  audience: "",
  hook: "Problem & Lösung",
  cta: "Unserem Discord beitreten",
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
function scrollToStatus(status) {
  requestAnimationFrame(() => {
    const board = document.querySelector(".kanban-board");
    const column = [...(board?.children || [])].find(
      (el) => el.dataset.status === status,
    );
    if (board && column)
      board.scrollTo({
        left: column.offsetLeft - board.firstElementChild.offsetLeft,
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
  });
}
function App() {
  const [user, setUser] = useState(null),
    [checking, setChecking] = useState(true),
    [spaces, setSpaces] = useState([]),
    [space, setSpace] = useState(null),
    [tasks, setTasks] = useState([]),
    [view, setView] = useState("board"),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("Alle Status"),
    [category, setCategory] = useState("Alle Inhalte"),
    [editing, setEditing] = useState(null),
    [statusChange, setStatusChange] = useState(null),
    [toast, setToast] = useState(""),
    [connected, setConnected] = useState(false),
    [mobile, setMobile] = useState(false),
    [pageError, setPageError] = useState("");
  const [deletingCampaign, setDeletingCampaign] = useState(null);
  function notify(text) {
    setToast(text);
    setTimeout(() => setToast(""), 6500);
  }
  async function loadSpace(slug) {
    try {
      setPageError("");
      const s = await api("/spaces/" + encodeURIComponent(slug));
      setSpace(s);
      const loaded = await api("/tasks?space=" + encodeURIComponent(s.slug));
      setTasks(loaded);
      if (loaded[0]) scrollToStatus(loaded[0].status);
    } catch (e) {
      setPageError(e.message);
      setSpace(null);
      setTasks([]);
    }
  }
  async function choose(s) {
    history.pushState({}, "", "/" + s.slug);
    setCategory("Alle Inhalte");
    setView("board");
    setEditing(null);
    setMobile(false);
    await loadSpace(s.slug);
  }
  async function refreshSpaces() {
    const result = await api("/spaces");
    setSpaces(result);
    return result;
  }
  useEffect(() => {
    api("/me")
      .then(setUser)
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);
  useEffect(() => {
    if (!user) return;
    refreshSpaces()
      .then((list) => {
        const slug = location.pathname.split("/").filter(Boolean)[0];
        if (slug) loadSpace(decodeURIComponent(slug));
        else if (list[0]) {
          history.replaceState({}, "", "/" + list[0].slug);
          loadSpace(list[0].slug);
        }
      })
      .catch((e) => setPageError(e.message));
    api("/settings")
      .then((s) => setConnected(s.connected))
      .catch((e) => notify(e.message));
    const pop = () => {
      const slug = location.pathname.split("/").filter(Boolean)[0];
      if (slug) loadSpace(decodeURIComponent(slug));
      else refreshSpaces().then((list) => list[0] && choose(list[0]));
    };
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, [user?.email]);
  useEffect(() => {
    if (!space) return;
    let active = true;
    const refresh = () =>
      api("/tasks?space=" + encodeURIComponent(space.slug))
        .then((result) => {
          if (active) setTasks(result);
        })
        .catch((e) => {
          if (active) {
            setPageError(e.message);
            setSpace(null);
            setTasks([]);
          }
        });
    const timer = setInterval(refresh, 15000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [space?.id]);
  if (checking)
    return (
      <div className="loading">
        <Sparkles />
        Astro-Media wird geladen…
      </div>
    );
  if (!user) return <Auth onLogin={setUser} />;
  const canEdit = space && space.role !== "viewer";
  const categories = [...new Set(tasks.map((t) => t.category).filter(Boolean))];
  const filtered = tasks.filter(
    (t) =>
      (category === "Alle Inhalte" || t.category === category) &&
      (filter === "Alle Status" || t.status === filter) &&
      (t.title + " " + t.description + " " + t.category)
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  async function save(t) {
    const result = await api("/tasks/" + t.id, {
      method: "PUT",
      body: JSON.stringify({ ...t, spaceId: space.id }),
    });
    setTasks((prev) => [result.task, ...prev.filter((x) => x.id !== t.id)]);
    setEditing(null);
    setFilter("Alle Status");
    scrollToStatus(result.task.status);
    notify(
      result.discordError
        ? "Gespeichert · " + result.discordError
        : "Aufgabe gespeichert" +
            (result.discord === "Synchronisiert"
              ? " · Discord aktualisiert"
              : ""),
    );
  }
  async function changeStatus(task, status) {
    if (
      (status === "In Planung" && !task.date) ||
      (status === "Fertig (Hochgeladen)" && !task.completionUrl)
    ) {
      setStatusChange({ task, status });
      return;
    }
    try {
      await save({ ...task, status });
    } catch (e) {
      notify(e.message);
    }
  }
  return (
    <div className="app">
      <aside className={mobile ? "sidebar open" : "sidebar"}>
        <a
          href={"/" + (space?.slug || "")}
          className="brand"
          onClick={(e) => e.preventDefault()}
        >
          <span className="brand-icon">
            <Sparkles size={22} />
          </span>
          Astro<span>-Media</span>
        </a>
        <div className="workspace">
          <span
            className="workspace-avatar"
            style={{ background: user.color, color: "white" }}
          >
            {(user.username || user.email)[0].toUpperCase()}
          </span>
          <div>
            <strong>{space?.name || "Dein Workspace"}</strong>
            <small>
              {space?.role === "viewer"
                ? "Nur ansehen"
                : space?.role === "editor"
                  ? "Geteilt · Bearbeiten"
                  : "Dein kreativer Orbit"}
            </small>
          </div>
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {[
            ["board", LayoutGrid, "Content Board"],
            ["calendar", CalendarDays, "Kalender"],
            ["media", ImageIcon, "Medienbibliothek"],
            ["spaces", Users, "Aufgabenbereiche"],
          ].map(([id, Icon, label]) => (
            <button
              className={"nav-item " + (view === id ? "active" : "")}
              key={id}
              onClick={() => {
                setView(id);
                setMobile(false);
              }}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <div className="nav-label campaign-label">
          AUFGABENBEREICHE
          <button
            title="Aufgabenbereiche verwalten"
            onClick={() => setView("spaces")}
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="sidebar-spaces">
          {spaces.map((s) => (
            <button
              key={s.id}
              className={
                "category-link " + (s.id === space?.id ? "chosen" : "")
              }
              onClick={() => choose(s)}
            >
              <span className="category-dot" />
              {s.name}
              {s.role !== "owner" && <Users size={12} />}
            </button>
          ))}
        </div>
        <div className="sidebar-bottom">
          <div className="discord-promo">
            <Send size={21} />
            <strong>Dein Team. Im selben Orbit.</strong>
            <p>Gemeinsame Planung mit persönlichen Farben in Discord.</p>
            <button onClick={() => setView("settings")}>
              {connected ? "Verbindung verwalten" : "Discord verbinden"}
              <ArrowUpRight size={15} />
            </button>
          </div>
          <button
            className={"nav-item " + (view === "settings" ? "active" : "")}
            onClick={() => {
              setView("settings");
              setMobile(false);
            }}
          >
            <Settings size={18} />
            Einstellungen
          </button>
          <div className="profile">
            <span
              className="user-avatar"
              style={{ background: user.color, color: "white" }}
            >
              {(user.username || user.email)[0].toUpperCase()}
            </span>
            <div>
              <strong>{user.username || "Mein Account"}</strong>
              <small>{user.email}</small>
            </div>
            <button
              title="Abmelden"
              onClick={async () => {
                try {
                  await api("/logout", { method: "POST" });
                  setUser(null);
                  setTasks([]);
                  setSpaces([]);
                  setSpace(null);
                } catch (e) {
                  notify(e.message);
                }
              }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <button
            className="mobile-menu"
            aria-label="Menü öffnen"
            onClick={() => setMobile(!mobile)}
          >
            <Menu size={21} />
          </button>
          <div className="breadcrumb">
            Astro-Media<span>/</span>
            <strong>{space?.name || "Workspace"}</strong>
          </div>
          <div className="topbar-right">
            <span className="live-dot" />
            Gemeinsam Ideen bewegen
            <span
              className="top-avatar"
              style={{ background: user.color, color: "white" }}
            >
              {(user.username || user.email)[0].toUpperCase()}
            </span>
          </div>
        </header>
        <div className="main-content">
          {pageError && (
            <div className="error" role="alert">
              {pageError} Wähle einen freigegebenen Aufgabenbereich in der
              Navigation.
            </div>
          )}
          {view === "settings" ? (
            <>
              <ProfileColor
                api={api}
                user={user}
                onChange={setUser}
                notify={notify}
              />
              <SettingsPage
                connected={connected}
                setConnected={setConnected}
                notify={notify}
              />
            </>
          ) : view === "spaces" ? (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">RAUM FÜR GEMEINSAME IDEEN</div>
                  <h1>Aufgabenbereiche</h1>
                  <p>Eigene Links. Klare Rechte. Ein gemeinsamer Plan.</p>
                </div>
              </div>
              <SpacesPanel
                api={api}
                spaces={spaces}
                active={space}
                onChange={choose}
                onCreated={async (s) => {
                  await refreshSpaces();
                  await choose(s);
                  setView("spaces");
                }}
                notify={notify}
              />
            </>
          ) : space && view === "media" ? (
            <MediaLibrary api={api} space={space} notify={notify} />
          ) : (
            space && (
              <>
                <div className="page-heading">
                  <div>
                    <div className="eyebrow">
                      DEIN CONTENT. IM RICHTIGEN ORBIT.
                    </div>
                    <h1>
                      {view === "calendar"
                        ? "Dein Content-Kalender"
                        : space.name}
                      <span className="heading-dot">
                        <Sparkles size={26} />
                      </span>
                    </h1>
                    <p>
                      Von der Idee zum Ergebnis. Jede Karte findet ihren
                      nächsten Platz.
                    </p>
                    <div className="area-meta">
                      <span>/{space.slug}</span>
                      <span>
                        {space.role === "owner"
                          ? "Eigentümer"
                          : canEdit
                            ? "Bearbeitungszugriff"
                            : "Lesezugriff"}
                      </span>
                    </div>
                  </div>
                  <div className="heading-actions">
                    <button
                      className="secondary"
                      onClick={() => setView("spaces")}
                    >
                      <Users size={16} />
                      Freigabe
                    </button>
                    {canEdit && (
                      <button
                        className="primary"
                        onClick={() =>
                          setEditing({ ...blank(), spaceId: space.id })
                        }
                      >
                        <Plus size={17} />
                        Neue Aufgabe
                      </button>
                    )}
                  </div>
                </div>
                <div className="stats">
                  <Stat
                    icon={LayoutGrid}
                    color="purple"
                    label="Inhalte insgesamt"
                    value={tasks.length}
                    note="Euer gemeinsamer Überblick"
                  />
                  <Stat
                    icon={Lightbulb}
                    color="orange"
                    label="Neue Ideen"
                    value={tasks.filter((t) => t.status === "Idee").length}
                    note="Bereit für den nächsten Schritt"
                  />
                  <Stat
                    icon={CalendarDays}
                    color="blue"
                    label="In Planung"
                    value={
                      tasks.filter((t) => t.status === "In Planung").length
                    }
                    note="Alles zu seiner Zeit"
                  />
                  <Stat
                    icon={CheckCircle2}
                    color="green"
                    label="Abgeschlossen"
                    value={
                      tasks.filter((t) => t.status === "Fertig (Hochgeladen)")
                        .length
                    }
                    note="Mit verlinktem Ergebnis"
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
                      aria-label="Kampagne filtern"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option>Alle Inhalte</option>
                      {categories.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                    {canEdit && category !== "Alle Inhalte" && (
                      <button
                        className="campaign-delete-button"
                        title="Kampagne löschen"
                        aria-label="Kampagne löschen"
                        onClick={() => setDeletingCampaign(category)}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <select
                      aria-label="Nach Status filtern"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      <option>Alle Status</option>
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {statusNames[statuses.indexOf(s)]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {view === "calendar" ? (
                  <Calendar
                    tasks={filtered}
                    onEdit={(t) => {
                      if (canEdit) setEditing(t);
                      else notify(t.title + " · " + t.status);
                    }}
                    onNew={(date) => {
                      if (canEdit)
                        setEditing({
                          ...blank(),
                          spaceId: space.id,
                          date: date + "T10:00",
                          status: "In Planung",
                        });
                    }}
                  />
                ) : (
                  <>
                    <div className="section-title">
                      <h2>
                        Status-Board <span>{filtered.length}</span>
                      </h2>
                      <span>
                        Status ändern → Karte wandert automatisch weiter.
                      </span>
                    </div>
                    <div
                      className="board-lanes-nav"
                      aria-label="Zu Status springen"
                    >
                      {statuses.map((status, index) => (
                        <button
                          key={status}
                          onClick={() => {
                            setFilter("Alle Status");
                            scrollToStatus(status);
                          }}
                        >
                          <span className={"lane-dot " + colors[index]} />
                          {statusNames[index]}
                          <small>
                            {tasks.filter((t) => t.status === status).length}
                          </small>
                        </button>
                      ))}
                    </div>
                    <div className="kanban-board">
                      {boardStatuses
                        .filter((s) => filter === "Alle Status" || s === filter)
                        .map((status, i) => (
                          <section
                            className="kanban-column"
                            data-status={status}
                            onDragOver={(e) => {
                              if (canEdit) {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = "move";
                              }
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (!canEdit) return;
                              const id = e.dataTransfer.getData(
                                "application/x-astro-task",
                              );
                              const task = tasks.find((t) => t.id === id);
                              if (task && task.status !== status)
                                changeStatus(task, status);
                            }}
                            key={status}
                            aria-label={status}
                          >
                            <div className="kanban-heading">
                              <Badge status={status} />
                              <span>
                                {
                                  filtered.filter((t) => t.status === status)
                                    .length
                                }
                              </span>
                            </div>
                            <div className="kanban-cards">
                              {filtered
                                .filter((t) => t.status === status)
                                .map((t) => (
                                  <TaskCard
                                    key={t.id}
                                    task={t}
                                    index={i}
                                    canEdit={canEdit}
                                    onEdit={() => setEditing(t)}
                                    onStatus={(s) => changeStatus(t, s)}
                                  />
                                ))}
                              {canEdit && (
                                <button
                                  className="column-add"
                                  onClick={() =>
                                    setEditing({
                                      ...blank(),
                                      spaceId: space.id,
                                      status,
                                    })
                                  }
                                >
                                  <Plus size={16} />
                                  Aufgabe hinzufügen
                                </button>
                              )}
                              {!filtered.some((t) => t.status === status) && (
                                <p className="column-empty">
                                  Raum für den nächsten Schritt.
                                </p>
                              )}
                            </div>
                          </section>
                        ))}
                    </div>
                    <div className="board-footer">
                      <span>
                        <span className="live-dot" />
                        Geteilte Inhalte werden alle 15 Sekunden aktualisiert.
                      </span>
                      <span>Astro-Media · Ideen bewegen</span>
                    </div>
                  </>
                )}
              </>
            )
          )}
        </div>
      </main>
      {editing && space && canEdit && (
        <Editor
          task={editing}
          space={space}
          categories={categories}
          onClose={() => setEditing(null)}
          onSave={save}
          onDelete={async () => {
            const r = await api("/tasks/" + editing.id, { method: "DELETE" });
            setTasks((prev) => prev.filter((t) => t.id !== editing.id));
            setEditing(null);
            notify(r.warning || "Aufgabe gelöscht.");
          }}
          existing={tasks.some((t) => t.id === editing.id)}
        />
      )}{" "}
      {deletingCampaign && (
        <CampaignDelete
          api={api}
          space={space}
          name={deletingCampaign}
          onClose={() => setDeletingCampaign(null)}
          onDeleted={async (result) => {
            setDeletingCampaign(null);
            setCategory("Alle Inhalte");
            await loadSpace(space.slug);
            notify(
              `Kampagne gelöscht. ${result.updated} Aufgaben bleiben erhalten.${result.discordFailed ? " Discord konnte nicht vollständig aktualisiert werden." : ""}`,
            );
          }}
        />
      )}
      {statusChange && (
        <StatusDialog
          task={statusChange.task}
          status={statusChange.status}
          onClose={() => setStatusChange(null)}
          onSave={save}
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
function TaskCard({ task: t, index, canEdit, onEdit, onStatus }) {
  const [open, setOpen] = useState(false);
  return (
    <article
      draggable={canEdit}
      onDragStart={(e) => {
        e.dataTransfer.setData("application/x-astro-task", t.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={"task-card kanban-task " + (open ? "expanded" : "")}
    >
      <button
        className="card-toggle"
        aria-label={"Status und Details: " + t.title}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <div className={"card-art art" + (index % 5)}>
          {t.assetIds?.[0] ? (
            <img
              src={"/api/assets/" + t.assetIds[0]}
              alt="Aufgabenmotiv"
              loading="lazy"
            />
          ) : (
            <>
              <div className="art-label">
                {t.format.toUpperCase()}
                <br />
                <em>IN ORBIT.</em>
              </div>
              <span className="art-star">
                <Sparkles size={45} />
              </span>
            </>
          )}
          <span className="format-chip">
            <Video size={12} />
            {t.platform}
          </span>
        </div>
        <div className="card-body">
          <div className="card-category">
            <span>{t.category || "OHNE KAMPAGNE"}</span>
            <ChevronDown size={16} />
          </div>
          <h3>{t.title}</h3>
          <p>
            {t.description ||
              "Eine gute Idee wartet auf ihren nächsten Schritt."}
          </p>
          <div className="card-bottom">
            <span>
              <CalendarDays size={13} />
              {t.date
                ? new Date(t.date).toLocaleDateString("de-DE", {
                    day: "numeric",
                    month: "short",
                  })
                : "Noch kein Termin"}
            </span>
            <span>{open ? "Schließen" : "Status & Details"}</span>
          </div>
        </div>
      </button>
      {open && (
        <div className="quick-actions">
          <label>
            Status
            <select
              aria-label={"Status für " + t.title}
              disabled={!canEdit}
              value={t.status}
              onChange={(e) => onStatus(e.target.value)}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {statusNames[statuses.indexOf(s)]}
                </option>
              ))}
            </select>
          </label>
          {t.exampleUrl && (
            <a href={t.exampleUrl} target="_blank" rel="noreferrer">
              💭 Beispiel ansehen <ArrowUpRight size={13} />
            </a>
          )}
          {t.completionUrl && (
            <a href={t.completionUrl} target="_blank" rel="noreferrer">
              ✅ Ergebnis öffnen <ArrowUpRight size={13} />
            </a>
          )}
          {t.script && (
            <details>
              <summary>📝 Videoscript ansehen</summary>
              <pre>{t.script}</pre>
            </details>
          )}
          {t.notes && (
            <details>
              <summary>🎬 Produktionsnotizen</summary>
              <p>{t.notes}</p>
            </details>
          )}
          {t.assetIds?.length > 0 && (
            <div className="card-media-links">
              {t.assetIds.map((id) => (
                <a
                  key={id}
                  href={"/api/assets/" + id}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img src={"/api/assets/" + id} alt="Angehängtes Medium" />
                </a>
              ))}
            </div>
          )}
          {canEdit ? (
            <button className="secondary" onClick={onEdit}>
              Inhalt & Script bearbeiten <ArrowUpRight size={14} />
            </button>
          ) : (
            <small>Dieser Bereich ist nur zum Ansehen freigegeben.</small>
          )}
        </div>
      )}
    </article>
  );
}
function Auth({ onLogin }) {
  const [register, setRegister] = useState(false),
    [email, setEmail] = useState(""),
    [username, setUsername] = useState(""),
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
          Astro-Media
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
        <small>Dein Marketing. Dein Rhythmus. Astro-Media.</small>
      </div>
      <div className="auth-form">
        <div className="auth-box">
          <span className="eyebrow">LET’S MAKE SOMETHING GREAT</span>
          <h2>{register ? "Dein Orbit wartet." : "Willkommen zurück."}</h2>
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
                    body: JSON.stringify({
                      email,
                      password,
                      ...(register ? { username } : {}),
                    }),
                  }),
                );
              } catch (e) {
                setError(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {register && (
              <label>
                Username
                <input
                  required
                  autoComplete="nickname"
                  minLength={2}
                  maxLength={32}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Dein Name in Astro-Media"
                />
              </label>
            )}
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
            {register ? "Schon einen Account?" : "Neu bei Astro-Media?"}{" "}
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
            Deine Inhalte sind nur für freigegebene Accounts sichtbar.
          </div>
        </div>
      </div>
    </div>
  );
}
function Editor({
  task,
  space,
  categories,
  onClose,
  onSave,
  onDelete,
  existing,
}) {
  const [t, setT] = useState({
    exampleUrl: "",
    completionUrl: "",
    assetIds: [],
    duration: "30–45 Sekunden",
    tone: "Nahbar & direkt",
    owner: "",
    notes: "",
    checklist: [],
    ...task,
    rpType: task.rpType || rpTypes[0],
    serverName: task.serverName || "",
    goal: rpGoals.includes(task.goal) ? task.goal : rpGoals[0],
    cta: rpCtas.includes(task.cta) ? task.cta : rpCtas[0],
  });
  const [tab, setTab] = useState("details"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [confirm, setConfirm] = useState(false),
    [replaceScript, setReplaceScript] = useState(false);
  const field = (key, value) => setT((prev) => ({ ...prev, [key]: value }));
  useEffect(() => {
    const previous = document.activeElement;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function keys(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const els = [
          ...document.querySelectorAll(
            ".editor button:not([disabled]),.editor input,.editor select,.editor textarea,.editor summary",
          ),
        ].filter((el) => el.offsetParent !== null);
        if (e.shiftKey && document.activeElement === els[0]) {
          e.preventDefault();
          els.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === els.at(-1)) {
          e.preventDefault();
          els[0]?.focus();
        }
      }
    }
    document.addEventListener("keydown", keys);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", keys);
      previous?.focus();
    };
  }, []);
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
  const quickDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(10, 0, 0, 0);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setT((prev) => ({ ...prev, date: local, status: "In Planung" }));
  };
  function generate() {
    if (t.script && !replaceScript) {
      setReplaceScript(true);
      return;
    }
    setReplaceScript(false);
    field("script", buildRpScript(t));
  }

  const presets = [
    ["Reel / Short", "Instagram", "Reel"],
    ["TikTok", "TikTok", "Video"],
    ["YouTube", "YouTube", "Video"],
    ["Carousel", "Instagram", "Carousel"],
  ];
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
            <span className="eyebrow">DEINE IDEE. DEIN NÄCHSTER SCHRITT.</span>
            <h2>
              {existing
                ? "Content weiterentwickeln"
                : "Was möchtest du erschaffen?"}
            </h2>
            <p className="editor-subtitle">
              Ein Titel genügt zum Start. Alles Weitere wächst mit deiner Idee.
            </p>
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
          {[
            ["details", Lightbulb, "Idee & Inhalt"],
            ["planning", CalendarDays, "Aufgabe & Planung"],
            ["script", Sparkles, "Script-Assistent"],
          ].map(([id, Icon, label], i) => (
            <button
              key={id}
              className={tab === id ? "selected" : ""}
              onClick={() => {
                setTab(id);
                setError("");
              }}
            >
              <span className="step-number">{i + 1}</span>
              <Icon size={16} />
              {label}
            </button>
          ))}
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
              setTab("planning");
              setError("Bitte lege einen Termin fest.");
              return;
            }
            if (t.status === "Fertig (Hochgeladen)" && !t.completionUrl) {
              setTab("planning");
              setError(
                "Bitte verlinke das Ergebnis, bevor du die Aufgabe abschließt.",
              );
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
                    placeholder="z. B. Neues Housing-System: Dein Zuhause in der Stadt"
                    maxLength={200}
                    value={t.title}
                    onChange={(e) => field("title", e.target.value)}
                  />
                </label>
                <details className="optional-section reference-section">
                  <summary>
                    Beispiel aus einem Link erstellen <span>Optional</span>
                  </summary>
                  <label>
                    Beispiellink
                    <input
                      type="url"
                      maxLength={1000}
                      value={t.exampleUrl}
                      onChange={(e) => field("exampleUrl", e.target.value)}
                      placeholder="https://www.instagram.com/reel/…"
                    />
                  </label>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      try {
                        const url = new URL(t.exampleUrl);
                        if (
                          !["http:", "https:"].includes(url.protocol) ||
                          url.username ||
                          url.password
                        )
                          throw Error();
                        setT((prev) => ({
                          ...prev,
                          title:
                            prev.title || "Inspiration von " + url.hostname,
                          description:
                            prev.description ||
                            "Beispiel für diesen Content: " + url.href,
                          exampleUrl: url.href,
                        }));
                        setError("");
                      } catch {
                        setError(
                          "Bitte einen gültigen HTTP(S)-Beispiellink eingeben.",
                        );
                      }
                    }}
                  >
                    <Link size={15} />
                    Als Beispiel übernehmen
                  </button>
                  {/^https?:\/\//.test(t.exampleUrl) && (
                    <a
                      className="reference-preview"
                      href={t.exampleUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      💭 Referenz öffnen <ArrowUpRight size={15} />
                    </a>
                  )}
                  <small className="template-note">
                    Der Link wird als Referenz gespeichert. Inhalte werden nicht
                    automatisch kopiert.
                  </small>
                </details>
                <div className="field-heading">
                  Schnellstart{" "}
                  <span>Optional · setzt Plattform und Format</span>
                </div>
                <div className="preset-grid">
                  {presets.map(([label, platform, format]) => (
                    <button
                      type="button"
                      key={label}
                      aria-pressed={
                        t.platform === platform && t.format === format
                      }
                      className={
                        t.platform === platform && t.format === format
                          ? "preset selected"
                          : "preset"
                      }
                      onClick={() =>
                        setT((prev) => ({ ...prev, platform, format }))
                      }
                    >
                      <Video size={17} />
                      {label}
                    </button>
                  ))}
                </div>
                <label>
                  Beschreibung
                  <textarea
                    rows={3}
                    maxLength={12000}
                    placeholder="Dein Gedanke, der wichtigste Nutzen oder ein erster Stichpunkt…"
                    value={t.description}
                    onChange={(e) => field("description", e.target.value)}
                  />
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
                <label>
                  Kampagne / Übermenü
                  <input
                    list="campaigns"
                    maxLength={200}
                    placeholder="Bestehende wählen oder neue Kampagne eingeben"
                    value={t.category}
                    onChange={(e) => field("category", e.target.value)}
                  />
                  <datalist id="campaigns">
                    {categories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </datalist>
                </label>
                <details className="optional-section">
                  <summary>
                    Fotos & Grafiken <span>{t.assetIds.length} verknüpft</span>
                  </summary>
                  <MediaLibrary
                    api={api}
                    space={space}
                    selected={t.assetIds}
                    onSelect={(ids) => field("assetIds", ids)}
                    notify={setError}
                  />
                </details>
                <div className="editor-next">
                  <span>
                    <Lightbulb size={17} />
                    Du kannst deine Idee schon jetzt speichern.
                  </span>
                  <button type="button" onClick={() => setTab("planning")}>
                    Planung ergänzen <ArrowRight size={16} />
                  </button>
                </div>
              </>
            ) : tab === "planning" ? (
              <>
                <div className="script-intro">
                  <span className="stat-icon blue">
                    <CalendarDays size={20} />
                  </span>
                  <div>
                    <h3>Von „irgendwann“ zu einem Plan.</h3>
                    <p>
                      Status, Termin und Produktion – so detailliert, wie du es
                      brauchst.
                    </p>
                  </div>
                </div>
                <div className="status-field">
                  <div className="field-heading">Status</div>
                  <div
                    className="status-options"
                    role="group"
                    aria-label="Status"
                  >
                    {statuses.map((status) => (
                      <button
                        type="button"
                        key={status}
                        className={
                          t.status === status
                            ? "status-option selected"
                            : "status-option"
                        }
                        aria-pressed={t.status === status}
                        onClick={() => field("status", status)}
                      >
                        <Badge status={status} />
                        {t.status === status && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </div>
                <label>
                  Veröffentlichungstermin{t.status === "In Planung" ? " *" : ""}
                  <input
                    type="datetime-local"
                    value={t.date}
                    onChange={(e) => field("date", e.target.value)}
                  />
                </label>
                <label>
                  Ergebnis-Link {t.status === "Fertig (Hochgeladen)" ? "*" : ""}
                  <input
                    type="url"
                    maxLength={1000}
                    value={t.completionUrl}
                    onChange={(e) => field("completionUrl", e.target.value)}
                    placeholder="https://… / dein veröffentlichter Inhalt"
                  />
                </label>
                <div className="date-shortcuts">
                  <button type="button" onClick={() => quickDate(1)}>
                    Morgen · 10 Uhr
                  </button>
                  <button type="button" onClick={() => quickDate(7)}>
                    In einer Woche · 10 Uhr
                  </button>
                  {t.date && (
                    <button type="button" onClick={() => field("date", "")}>
                      Termin entfernen
                    </button>
                  )}
                </div>
                <div className="hint">
                  <CalendarDays size={18} />
                  <p>
                    „In Planung“ benötigt einen Termin. Du kannst auch für
                    andere Status einen Termin im Kalender hinterlegen.
                  </p>
                </div>
                <details className="optional-section">
                  <summary>
                    Produktion & Notizen <span>Optional</span>
                  </summary>
                  <label>
                    Verantwortlich
                    <input
                      maxLength={120}
                      value={t.owner}
                      onChange={(e) => field("owner", e.target.value)}
                      placeholder="Name oder Team"
                    />
                  </label>
                  <label>
                    Produktionsnotizen
                    <textarea
                      rows={3}
                      maxLength={12000}
                      value={t.notes}
                      onChange={(e) => field("notes", e.target.value)}
                      placeholder="Drehort, Requisiten, Links, Schnittideen…"
                    />
                  </label>
                  <div className="field-heading">
                    Produktions-Checkliste{" "}
                    <span>{t.checklist.length}/5 erledigt</span>
                  </div>
                  <div className="production-checklist">
                    {[
                      "Script finalisiert",
                      "Aufnahme erledigt",
                      "Schnitt abgeschlossen",
                      "Untertitel & Cover erstellt",
                      "Freigabe erhalten",
                    ].map((item) => (
                      <label key={item}>
                        <input
                          type="checkbox"
                          checked={t.checklist.includes(item)}
                          onChange={(e) =>
                            field(
                              "checklist",
                              e.target.checked
                                ? [...t.checklist, item]
                                : t.checklist.filter((x) => x !== item),
                            )
                          }
                        />
                        {item}
                      </label>
                    ))}
                  </div>
                </details>
              </>
            ) : (
              <>
                <div className="script-intro">
                  <span className="stat-icon purple">
                    <Sparkles size={20} />
                  </span>
                  <div>
                    <h3>Deine Stadt. Deine Geschichten.</h3>
                    <p>
                      Erstelle Gameplay-Scripts für Features, Fraktionen,
                      Updates und die Community deines GTA-RP-Servers.
                    </p>
                  </div>
                </div>
                <div className="form-row">
                  {select("rpType", "Was möchtest du vorstellen?", rpTypes)}
                  <label>
                    GTA-RP-Server
                    <input
                      maxLength={80}
                      value={t.serverName}
                      onChange={(e) => field("serverName", e.target.value)}
                      placeholder="Name deiner Stadt / deines Servers"
                    />
                  </label>
                </div>
                <div className="form-row">
                  {select("goal", "Was ist dein Ziel?", rpGoals)}
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
                    maxLength={500}
                    placeholder="z. B. neue RP-Spieler, erfahrene Cops, zivile Charaktere"
                    value={t.audience}
                    onChange={(e) => field("audience", e.target.value)}
                  />
                </label>
                <div className="form-row">
                  {select("duration", "Videolänge", [
                    "15 Sekunden",
                    "30–45 Sekunden",
                    "60–90 Sekunden",
                  ])}
                  {select("tone", "Tonalität", [
                    "Nahbar & direkt",
                    "Informativ & sachlich",
                    "Humorvoll & locker",
                    "Inspirierend & motivierend",
                  ])}
                </div>
                {select("cta", "Was soll danach passieren?", rpCtas)}
                <button type="button" className="generate" onClick={generate}>
                  <Sparkles size={17} />
                  {replaceScript
                    ? "Vorhandenes Script wirklich ersetzen?"
                    : t.script
                      ? "Neue Script-Vorlage erstellen"
                      : "Script-Vorlage erstellen"}
                </button>
                {replaceScript && (
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setReplaceScript(false)}
                  >
                    Vorhandenes Script behalten
                  </button>
                )}
                <small className="template-note">
                  Deine Auswahl bestimmt Aufbau, Timing und Schwerpunkt. Fülle
                  die Platzhalter mit eigenen Beispielen.
                </small>
                <label>
                  Dein Videoscript
                  <textarea
                    className="script-text"
                    rows={12}
                    maxLength={12000}
                    value={t.script}
                    onChange={(e) => field("script", e.target.value)}
                    placeholder="Erstelle eine Vorlage oder schreibe direkt los…"
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
                        setError("Bitte Text markieren und manuell kopieren.");
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
              <span className="save-note">Nur der Titel ist Pflicht</span>
            )}
            <div>
              <button type="button" className="secondary" onClick={onClose}>
                Abbrechen
              </button>
              <button className="primary" disabled={busy}>
                <Check size={16} />
                {busy ? "Speichern…" : "Aufgabe speichern"}
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
    [busy, setBusy] = useState(false),
    [feedback, setFeedback] = useState(null),
    [testedAt, setTestedAt] = useState(null);
  useEffect(() => {
    api("/settings")
      .then((s) => setTestedAt(s.testedAt))
      .catch((e) => setFeedback({ ok: false, text: e.message }));
  }, []);
  async function testSaved() {
    setBusy(true);
    setFeedback(null);
    try {
      const r = await api("/discord/test", { method: "POST" });
      setTestedAt(r.testedAt);
      setFeedback({
        ok: true,
        text: "Testnachricht von Discord bestätigt. Schau in deinen Kanal!",
      });
    } catch (e) {
      setFeedback({ ok: false, text: e.message });
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">ALLES GUT VERBUNDEN</div>
          <h1>
            Einstellungen
            <span className="heading-dot">
              <Sparkles size={27} />
            </span>
          </h1>
          <p>Dein Workspace. Deine Verbindungen.</p>
        </div>
      </div>
      <section className="settings-card">
        <div className="settings-title">
          <span className="discord-logo">
            <Send size={27} />
          </span>
          <div>
            <h2>Discord-Integration</h2>
            <p>Deine Planung. Direkt im Team-Chat.</p>
          </div>
          <span className={"badge " + (connected ? "green" : "gray")}>
            <i />
            {connected
              ? testedAt
                ? "Verbindung getestet"
                : "Webhook hinterlegt"
              : "Nicht verbunden"}
          </span>
        </div>
        <div className="steps">
          <p>
            <b>01</b>Öffne die Einstellungen eines Discord-Textkanals →
            Integrationen → Webhooks.
          </p>
          <p>
            <b>02</b>Erstelle einen Webhook und kopiere die vollständige
            Webhook-URL.
          </p>
          <p>
            <b>03</b>Verbinde deinen Kanal. Wir senden sofort eine sichtbare
            Testnachricht.
          </p>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setFeedback(null);
            try {
              const r = await api("/settings", {
                method: "PUT",
                body: JSON.stringify({ webhook: url }),
              });
              setConnected(r.connected);
              setTestedAt(r.testedAt);
              setUrl("");
              setFeedback({
                ok: true,
                text: "Verbunden! Discord hat die Testnachricht bestätigt. Neue Aufgaben werden ab jetzt automatisch übertragen.",
              });
              notify("Discord verbunden · Testnachricht gesendet.");
            } catch (e) {
              setFeedback({ ok: false, text: e.message });
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
                  ? "Neue URL zum Wechseln des Kanals einfügen"
                  : "https://discord.com/api/webhooks/…"
              }
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              disabled={busy}
            />
          </label>
          <div className="settings-actions">
            <button className="primary" disabled={busy}>
              <Link size={16} />
              {busy
                ? "Discord wird kontaktiert…"
                : "Verbinden & Testnachricht senden"}
            </button>
            {connected && (
              <>
                <button
                  type="button"
                  className="secondary"
                  disabled={busy}
                  onClick={testSaved}
                >
                  <Send size={15} />
                  Testnachricht senden
                </button>
                <button
                  type="button"
                  className="secondary"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setFeedback(null);
                    try {
                      const r = await api("/discord/sync", { method: "POST" });
                      setFeedback({
                        ok: !r.failed,
                        text: `${r.total - r.failed} von ${r.total} Aufgaben synchronisiert.${r.error ? " " + r.error : ""}`,
                      });
                    } catch (e) {
                      setFeedback({ ok: false, text: e.message });
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <CheckCircle2 size={15} />
                  Alle synchronisieren
                </button>
                <button
                  type="button"
                  className="text-button"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await api("/settings", {
                        method: "PUT",
                        body: JSON.stringify({ webhook: "" }),
                      });
                      setConnected(false);
                      setTestedAt(null);
                      setFeedback({
                        ok: true,
                        text: "Verbindung getrennt. Bestehende Nachrichten bleiben im Discord-Kanal.",
                      });
                    } catch (e) {
                      setFeedback({ ok: false, text: e.message });
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Trennen
                </button>
              </>
            )}
          </div>
        </form>
        {feedback && (
          <div
            role={feedback.ok ? "status" : "alert"}
            className={
              "connection-feedback " + (feedback.ok ? "success" : "failure")
            }
          >
            {feedback.ok ? <CheckCircle2 size={20} /> : <X size={20} />}
            <div>
              <strong>
                {feedback.ok
                  ? "Das hat geklappt"
                  : "Verbindung konnte nicht bestätigt werden"}
              </strong>
              <p>{feedback.text}</p>
            </div>
          </div>
        )}
        {testedAt && (
          <p className="test-timestamp">
            Zuletzt erfolgreich getestet:{" "}
            {new Date(testedAt).toLocaleString("de-DE")}
          </p>
        )}
        <div className="discord-preview">
          <span className="preview-avatar">
            <Clapperboard size={20} />
          </span>
          <div>
            <strong>
              Astro-Media <span>APP</span>
            </strong>
            <div className="preview-embed">
              <h3>✓ Astro-Media ist verbunden</h3>
              <p>
                Die Testnachricht ist angekommen! Deine Aufgaben und
                Statusänderungen erscheinen hier.
              </p>
              <small>ASTRO-MEDIA • Verbindungstest</small>
            </div>
          </div>
        </div>
        <div className="hint">
          <CheckCircle2 size={19} />
          <p>
            Aufgaben erhalten farbige Nachrichten, die bei Änderungen
            aktualisiert werden. Die URL bleibt auf dem Server. Bereits
            vorhandene Aufgaben überträgst du mit „Alle synchronisieren“. Beim
            Kanalwechsel bleiben alte Nachrichten erhalten.
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
