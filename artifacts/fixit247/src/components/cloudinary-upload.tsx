import { useRef, useState } from "react";
import { Upload, Loader2, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Props {
  folder?: string;
  onUploaded: (url: string) => void;
  label?: string;
  accept?: string;
  className?: string;
}

type SignResponse = {
  signature: string;
  timestamp: number;
  folder: string;
  cloudName: string;
  apiKey: string;
};

export function CloudinaryUpload({
  folder = "fixit247",
  onUploaded,
  label = "Upload photo",
  accept = "image/*",
  className = "",
}: Props) {
  const { token } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      // 1. Get signed params from our API
      const signRes = await fetch(`${API_BASE}/api/uploads/sign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ folder }),
      });
      if (!signRes.ok) {
        const body = await signRes.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? "Upload not available");
      }
      const sign = await signRes.json() as SignResponse;

      // 2. Upload directly to Cloudinary
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sign.apiKey);
      form.append("timestamp", String(sign.timestamp));
      form.append("signature", sign.signature);
      form.append("folder", sign.folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`,
        { method: "POST", body: form },
      );
      if (!uploadRes.ok) throw new Error("Upload to Cloudinary failed");
      const uploadData = await uploadRes.json() as { secure_url: string };
      onUploaded(uploadData.secure_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="h-8 px-3 rounded-lg bg-white/6 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/70 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? (
          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…</>
        ) : (
          <><Upload className="h-3.5 w-3.5" /> {label}</>
        )}
      </button>
      {error && (
        <span className="text-[10px] text-red-400 flex items-center gap-1">
          <X className="h-3 w-3" /> {error}
        </span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}
