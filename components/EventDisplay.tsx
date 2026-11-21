"use client";

import { useSyncExternalStore } from "react";
import { QRCodeSVG } from "qrcode.react";

const subscribe = () => () => {};
const browserOrigin = () => window.location.origin;
const serverOrigin = () => "";

export default function EventDisplay({ title, slug }: { title: string; slug: string }) {
  const origin = useSyncExternalStore(subscribe, browserOrigin, serverOrigin);
  const path = `/${encodeURIComponent(slug)}`;
  const url = origin ? new URL(path, origin) : null;
  const loopback = url && /^(?:127\.|(?:.*\.)?localhost$|\[::1\]$|0\.0\.0\.0$)/i.test(url.hostname);

  return <main className="desk event-display">
    <section className="event-poster" aria-labelledby="event-title">
      <div className="event-copy">
        <p className="kicker"><span className="ink-line" /> Feedback form</p>
        <h1 id="event-title">{title}</h1>
        <p className="event-instruction">Scan with your phone camera to leave feedback.</p>
        <a className="inline-link event-link" href={path}>{url ? url.host + path : "Open the feedback form"}</a>
      </div>
      <div className="event-code">
        {url && <QRCodeSVG value={url.href} size={360} level="M" marginSize={4} title={`QR code for ${title}`} />}
      </div>
    </section>
    {loopback && <p className="event-local-note">Local preview. For a phone scan, open this display at the server’s LAN address or its published address.</p>}
  </main>;
}
