"use client";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function BookingSearchForm({
  slug, professionals, selectedId = "", date = ""
}: {
  slug:string;
  professionals:{id:string;name:string;label:string}[];
  selectedId?:string;
  date?:string;
}) {
  const router = useRouter();
  const [loading,setLoading] = useState(false);
  function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true);
    const fd = new FormData(e.currentTarget);
    const p = String(fd.get("profissional")||""); const d=String(fd.get("date")||"");
    router.push(`/agendar/${slug}/horarios?profissional=${encodeURIComponent(p)}&date=${encodeURIComponent(d)}`);
  }
  return <form onSubmit={submit} className="card booking-form booking-filter">
    <label>Profissional<select name="profissional" defaultValue={selectedId} required><option value="">Selecione</option>{professionals.map(p=><option key={p.id} value={p.id}>{p.name} — {p.label}</option>)}</select></label>
    <label>Data<input name="date" type="date" defaultValue={date} required/></label>
    <button className="btn btn-secondary" disabled={loading} aria-busy={loading}>{loading && <span className="button-spinner"/>}{loading ? "Buscando horários..." : "Ver horários"}</button>
  </form>;
}
