"use client";

import { useState } from "react";

export default function PrivacyVideo({ videoId, title }: { videoId: string; title: string }) {
  const [loaded, setLoaded] = useState(false);
  if (loaded) {
    return <iframe src={"https://fast.wistia.net/embed/iframe/" + videoId + "?videoFoam=true"}
      title={title} allowFullScreen className="w-full h-full" style={{border:0,display:"block"}} />;
  }
  return <div className="privacy-video">
    <p>{title}</p>
    <button type="button" onClick={() => setLoaded(true)}>Load video</button>
    <p>Loading connects to Wistia, which may use cookies and receive technical information.</p>
    <a href="/privacy">Read the privacy notice</a>
    <p>For help accessing the video or its information, call (210) 870-5200.</p>
  </div>;
}
