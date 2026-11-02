"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

export type CameraStatus = "starting" | "scanning" | "denied" | "unsupported";

// Kamera + QR-Erkennung (jsQR, rein clientseitig, kein Upload von Bildern).
// onCode wird pro erkanntem Code genau einmal aufgerufen; danach pausiert die
// Erkennung, bis resume() aufgerufen wird.
export function useQrCamera(onCode: (text: string) => void) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const busyRef = useRef(false);
  const onCodeRef = useRef(onCode);
  const [status, setStatus] = useState<CameraStatus>("starting");

  useEffect(() => {
    onCodeRef.current = onCode;
  }, [onCode]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let stopped = false;
    let raf: number | undefined;

    function tick() {
      if (stopped) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA && !busyRef.current) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(img.data, img.width, img.height);
          if (code?.data) {
            busyRef.current = true;
            onCodeRef.current(code.data);
          }
        }
      }
      raf = requestAnimationFrame(tick);
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        if (stopped) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(() => {});
        }
        setStatus("scanning");
        raf = requestAnimationFrame(tick);
      })
      .catch(() => setStatus("denied"));

    return () => {
      stopped = true;
      if (raf) cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const resume = useCallback(() => {
    busyRef.current = false;
  }, []);

  return { videoRef, canvasRef, status, resume };
}

export function CameraMessage({ status }: { status: CameraStatus }) {
  if (status === "scanning") return null;
  const text =
    status === "starting"
      ? "Kamera wird gestartet …"
      : status === "denied"
        ? "Kein Kamerazugriff. Bitte erlaube die Kamera in den Browser-Einstellungen und lade die Seite neu."
        : "Dieser Browser unterstützt keinen Kamerazugriff. Du kannst den Code stattdessen eintippen.";
  return (
    <div className={`absolute inset-0 grid place-items-center bg-[#14110F] p-6 text-center text-sm ${status === "starting" ? "text-[#B3A898]" : "text-[#F97066]"}`}>
      {text}
    </div>
  );
}
