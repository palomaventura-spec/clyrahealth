"use client";

import { useState } from "react";

const MAX_LOGO_BYTES = 300 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function ClinicBrandingFields({
  defaultLogoUrl = "",
  defaultAccentColor = "#2563eb"
}: {
  defaultLogoUrl?: string | null;
  defaultAccentColor?: string | null;
}) {
  const [logoData, setLogoData] = useState(defaultLogoUrl ?? "");
  const [removeLogo, setRemoveLogo] = useState(false);
  const [error, setError] = useState("");

  function onLogoChange(file?: File) {
    setError("");
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Use uma imagem PNG, JPG ou WebP.");
      return;
    }

    if (file.size > MAX_LOGO_BYTES) {
      setError("A logo deve ter no máximo 300 KB nesta versão do piloto.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setLogoData(result);
      setRemoveLogo(false);
    };
    reader.onerror = () => setError("Não foi possível ler a imagem.");
    reader.readAsDataURL(file);
  }

  return (
    <>
      <div className="span-2 clinic-branding-field">
        <label>Logo da clínica</label>
        <div className="clinic-logo-editor">
          <div className="clinic-logo-preview">
            {!removeLogo && logoData ? (
              <img src={logoData} alt="Prévia da logo da clínica" />
            ) : (
              <div className="brand">Clyra<span>Health</span></div>
            )}
          </div>

          <div className="clinic-logo-controls">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={event => onLogoChange(event.target.files?.[0])}
            />
            <small>PNG, JPG ou WebP · máximo 300 KB no piloto.</small>
            {logoData && !removeLogo && (
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => setRemoveLogo(true)}
              >
                Remover logo
              </button>
            )}
            {error && <span className="field-error">{error}</span>}
          </div>
        </div>

        <input type="hidden" name="logoData" value={removeLogo ? "" : logoData} />
        <input type="hidden" name="removeLogo" value={removeLogo ? "1" : "0"} />
      </div>

      <label>
        Cor principal
        <input
          name="accentColor"
          type="color"
          defaultValue={defaultAccentColor ?? "#2563eb"}
        />
      </label>
    </>
  );
}
