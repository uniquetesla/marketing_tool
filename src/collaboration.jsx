import React, { useState, useEffect } from "react";
import {
  Plus,
  Copy,
  Trash2,
  Upload,
  Link,
  Check,
  X,
  Users,
  Image,
  ExternalLink,
} from "lucide-react";
export function ProfileColor({ api, user, onChange, notify }) {
  const [color, setColor] = useState(user.color || "#9476ce");
  return (
    <section className="settings-card profile-color">
      <div>
        <h2>Deine Team-Farbe</h2>
        <p>
          Diese Farbe kennzeichnet deine Änderungen in Discord – auch in
          geteilten Aufgabenbereichen.
        </p>
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            const result = await api("/profile", {
              method: "PUT",
              body: JSON.stringify({ color }),
            });
            onChange({ ...user, ...result });
            notify("Deine Farbe wurde gespeichert.");
          } catch (e) {
            notify(e.message);
          }
        }}
      >
        <label>
          Persönliche Farbe
          <input
            aria-label="Persönliche Farbe"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </label>
        <span className="color-preview" style={{ borderColor: color }}>
          🚀 {user.email}
        </span>
        <button className="primary">Farbe speichern</button>
      </form>
    </section>
  );
}
export function SpacesPanel({
  api,
  spaces,
  active,
  onChange,
  onCreated,
  notify,
}) {
  const [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [role, setRole] = useState("viewer"),
    [members, setMembers] = useState([]),
    [busy, setBusy] = useState(false);
  async function load() {
    if (active?.role === "owner")
      try {
        setMembers(await api("/spaces/" + active.slug + "/members"));
      } catch (e) {
        notify(e.message);
      }
    else setMembers([]);
  }
  useEffect(() => {
    load();
  }, [active?.slug]);
  return (
    <div className="spaces-panel">
      <section className="settings-card">
        <h2>Deine Aufgabenbereiche</h2>
        <p>
          Jeder Bereich hat einen eigenen Link. Freigegebene Personen melden
          sich mit ihrem eigenen Account an.
        </p>
        <div className="space-list">
          {spaces.map((s) => (
            <button
              key={s.id}
              className={active?.id === s.id ? "selected" : ""}
              onClick={() => onChange(s)}
            >
              <Users size={18} />
              <span>
                <strong>{s.name}</strong>
                <small>/{s.slug}</small>
              </span>
              <span className="badge purple">
                {s.role === "owner"
                  ? "Eigentümer"
                  : s.role === "editor"
                    ? "Bearbeiten"
                    : "Ansehen"}
              </span>
            </button>
          ))}
        </div>
        <form
          className="inline-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              const space = await api("/spaces", {
                method: "POST",
                body: JSON.stringify({ name }),
              });
              setName("");
              await onCreated(space);
              notify("Aufgabenbereich erstellt.");
            } catch (e) {
              notify(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Neuer Aufgabenbereich
            <input
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z. B. Sommer-Kampagne"
            />
          </label>
          <button className="primary" disabled={busy}>
            <Plus size={16} />
            Bereich erstellen
          </button>
        </form>
      </section>
      {active && (
        <section className="settings-card">
          <h2>Freigabe · {active.name}</h2>
          <div className="share-link">
            <Link size={17} />
            <input
              aria-label="Bereichslink"
              readOnly
              value={location.origin + "/" + active.slug}
            />
            <button
              title="Link kopieren"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    location.origin + "/" + active.slug,
                  );
                  notify("Bereichslink kopiert.");
                } catch {
                  notify("Bitte den Link manuell kopieren.");
                }
              }}
            >
              <Copy size={17} />
            </button>
          </div>
          <p>
            Der Link allein gewährt keinen Zugriff. Nur ausdrücklich
            freigegebene Accounts können diesen Bereich öffnen.
          </p>
          {active.role === "owner" ? (
            <>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  try {
                    await api("/spaces/" + active.slug + "/members", {
                      method: "POST",
                      body: JSON.stringify({ email, role }),
                    });
                    setEmail("");
                    await load();
                    notify(
                      "Freigabe gespeichert. Teile jetzt den Bereichslink.",
                    );
                  } catch (e) {
                    notify(e.message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <div className="form-row">
                  <label>
                    Registrierte E-Mail-Adresse
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="person@beispiel.de"
                    />
                  </label>
                  <label>
                    Berechtigung
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="viewer">Nur ansehen</option>
                      <option value="editor">Ansehen & bearbeiten</option>
                    </select>
                  </label>
                </div>
                <button className="primary" disabled={busy}>
                  <Users size={16} />
                  Freigeben / Recht aktualisieren
                </button>
              </form>
              <div className="members-list">
                {members.map((m) => (
                  <div key={m.id}>
                    <i style={{ background: m.color }} />
                    <strong>{m.email}</strong>
                    <span>
                      {m.role === "editor" ? "Bearbeiten" : "Ansehen"}
                    </span>
                    <button
                      title={"Freigabe für " + m.email + " entfernen"}
                      onClick={async () => {
                        try {
                          await api(
                            "/spaces/" + active.slug + "/members/" + m.id,
                            { method: "DELETE" },
                          );
                          await load();
                          notify("Freigabe entfernt.");
                        } catch (e) {
                          notify(e.message);
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {!members.length && (
                  <p>Noch keine weiteren Personen freigegeben.</p>
                )}
              </div>
            </>
          ) : (
            <div className="hint">
              Du hast{" "}
              {active.role === "editor" ? "Bearbeitungsrechte" : "Leserechte"}.
              Freigaben verwaltet der Eigentümer.
            </div>
          )}
        </section>
      )}
    </div>
  );
}
export function MediaLibrary({ api, space, notify, selected, onSelect }) {
  const [assets, setAssets] = useState([]),
    [busy, setBusy] = useState(false);
  const picker = !!onSelect;
  async function load() {
    try {
      setAssets(await api("/assets?space=" + encodeURIComponent(space.slug)));
    } catch (e) {
      notify(e.message);
    }
  }
  useEffect(() => {
    load();
  }, [space.slug]);
  return (
    <section
      className={"media-library " + (picker ? "media-picker" : "settings-card")}
    >
      <div className="media-heading">
        <div>
          <h2>{picker ? "Fotos & Grafiken verknüpfen" : "Medienbibliothek"}</h2>
          <p>PNG, JPEG, WebP oder GIF · bis 8 MB je Bild · 100 MB je Bereich</p>
        </div>
        {space.role !== "viewer" && (
          <label className="secondary upload-button">
            <Upload size={16} />
            {busy ? "Wird hochgeladen…" : "Bild hochladen"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              disabled={busy}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 8 * 1024 * 1024) {
                  notify("Das Bild darf maximal 8 MB groß sein.");
                  e.target.value = "";
                  return;
                }
                setBusy(true);
                try {
                  const result = await api(
                    "/assets?space=" + encodeURIComponent(space.slug),
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/octet-stream",
                        "X-File-Name": encodeURIComponent(file.name),
                      },
                      body: await file.arrayBuffer(),
                    },
                  );
                  await load();
                  if (picker && selected.length < 20)
                    onSelect([...selected, result.id]);
                  notify("Bild hochgeladen.");
                } catch (error) {
                  notify(error.message);
                } finally {
                  setBusy(false);
                  e.target.value = "";
                }
              }}
            />
          </label>
        )}
      </div>
      <div className="media-grid">
        {assets.map((asset) => (
          <div
            className={
              "media-item " + (selected?.includes(asset.id) ? "selected" : "")
            }
            key={asset.id}
          >
            {picker ? (
              <button
                type="button"
                aria-pressed={selected.includes(asset.id)}
                onClick={() =>
                  onSelect(
                    selected.includes(asset.id)
                      ? selected.filter((id) => id !== asset.id)
                      : selected.length < 20
                        ? [...selected, asset.id]
                        : selected,
                  )
                }
              >
                <img
                  loading="lazy"
                  src={"/api/assets/" + asset.id}
                  alt={asset.name}
                />
                {selected.includes(asset.id) && (
                  <span className="media-check">
                    <Check size={16} />
                  </span>
                )}
              </button>
            ) : (
              <a
                href={"/api/assets/" + asset.id}
                target="_blank"
                rel="noreferrer"
              >
                <img
                  loading="lazy"
                  src={"/api/assets/" + asset.id}
                  alt={asset.name}
                />
              </a>
            )}
            <div>
              <span title={asset.name}>{asset.name}</span>
              <small>{Math.ceil(asset.bytes / 1024)} KB</small>
              {!picker && space.role !== "viewer" && (
                <button
                  title={"Bild " + asset.name + " löschen"}
                  onClick={async () => {
                    try {
                      await api("/assets/" + asset.id, { method: "DELETE" });
                      await load();
                      notify(
                        "Bild gelöscht. Verknüpfungen in Aufgaben werden entfernt.",
                      );
                    } catch (e) {
                      notify(e.message);
                    }
                  }}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {!assets.length && (
        <div className="media-empty">
          <Image size={27} />
          <p>
            Noch keine Medien. Lade dein erstes Foto oder deine erste Grafik
            hoch.
          </p>
        </div>
      )}
    </section>
  );
}
export function StatusDialog({ task, status, onClose, onSave }) {
  const [url, setUrl] = useState(task.completionUrl || ""),
    [date, setDate] = useState(task.date || ""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <div className="modal-backdrop">
      <section
        className="status-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Status ändern"
      >
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Schließen"
        >
          <X />
        </button>
        <span className="eyebrow">NÄCHSTER SCHRITT</span>
        <h2>
          {status === "In Planung"
            ? "Wann geht dein Content live?"
            : "Zeig uns dein Ergebnis."}
        </h2>
        <p>{task.title}</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await onSave({ ...task, status, date, completionUrl: url });
              onClose();
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {status === "In Planung" ? (
            <label>
              Veröffentlichungstermin
              <input
                autoFocus
                type="datetime-local"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
          ) : (
            <label>
              Ergebnis-Link
              <input
                autoFocus
                type="url"
                required
                maxLength={1000}
                placeholder="https://…"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </label>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="primary" disabled={busy}>
            {busy ? "Speichern…" : "Status übernehmen"}
          </button>
        </form>
      </section>
    </div>
  );
}
