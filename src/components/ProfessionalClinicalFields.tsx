"use client";

import { useMemo, useState } from "react";

export const PROFESSIONAL_TYPES = [
  ["DOCTOR", "Médico(a)"],
  ["DENTIST", "Dentista"],
  ["PHYSIOTHERAPIST", "Fisioterapeuta"],
  ["PSYCHOLOGIST", "Psicólogo(a)"],
  ["NUTRITIONIST", "Nutricionista"],
  ["SPEECH_THERAPIST", "Fonoaudiólogo(a)"],
  ["OTHER", "Outro"],
] as const;

const SPECIALTIES: Record<string, string[]> = {
  DOCTOR: ["Clínica Médica", "Cardiologia", "Dermatologia", "Endocrinologia", "Ginecologia e Obstetrícia", "Neurologia", "Oftalmologia", "Ortopedia e Traumatologia", "Otorrinolaringologia", "Pediatria", "Psiquiatria", "Urologia"],
  DENTIST: ["Clínica Geral", "Endodontia", "Implantodontia", "Odontopediatria", "Ortodontia", "Periodontia", "Prótese Dentária", "Cirurgia Bucomaxilofacial"],
  PHYSIOTHERAPIST: ["Fisioterapia Traumato-Ortopédica", "Fisioterapia Esportiva", "Fisioterapia Neurológica", "Fisioterapia Respiratória", "Fisioterapia Pélvica", "Fisioterapia Pediátrica", "Fisioterapia Geriátrica"],
  PSYCHOLOGIST: ["Psicologia Clínica", "Psicologia Infantil", "Psicologia do Adolescente", "Psicologia Hospitalar", "Neuropsicologia", "Terapia de Casal e Família"],
  NUTRITIONIST: ["Nutrição Clínica", "Nutrição Esportiva", "Nutrição Materno-Infantil", "Nutrição Funcional", "Nutrição Comportamental", "Nutrição Geriátrica"],
  SPEECH_THERAPIST: ["Linguagem", "Motricidade Orofacial", "Voz", "Audiologia", "Disfagia", "Fonoaudiologia Educacional", "Fonoaudiologia Neurofuncional"],
  OTHER: [],
};

export function ProfessionalClinicalFields({
  defaultType = "DOCTOR",
  defaultSpecialty = "",
  disabled = false,
}: {
  defaultType?: string;
  defaultSpecialty?: string;
  disabled?: boolean;
}) {
  const [type, setType] = useState(defaultType);
  const options = useMemo(() => SPECIALTIES[type] ?? [], [type]);
  const initialPreset = options.includes(defaultSpecialty) ? defaultSpecialty : "";
  const [specialty, setSpecialty] = useState(initialPreset);
  const [custom, setCustom] = useState(defaultSpecialty && !initialPreset ? defaultSpecialty : "");

  return <>
    <label>Profissão
      <select name="type" value={type} onChange={(e) => { setType(e.target.value); setSpecialty(""); setCustom(""); }} disabled={disabled}>
        {PROFESSIONAL_TYPES.map(([value,label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      {disabled && <input type="hidden" name="type" value={type}/>} 
    </label>
    <label>Especialidade
      <select name="specialtyPreset" value={specialty} onChange={(e) => { setSpecialty(e.target.value); if (e.target.value) setCustom(""); }} disabled={disabled || options.length === 0}>
        <option value="">{options.length ? "Selecione a especialidade" : "Informe abaixo"}</option>
        {options.map((name) => <option key={name} value={name}>{name}</option>)}
      </select>
      <small className="field-help">As opções mudam conforme a profissão escolhida.</small>
    </label>
    <label className="span-2">Outra especialidade / área de atuação
      <input name="newSpecialtyName" value={custom} onChange={(e) => { setCustom(e.target.value); if (e.target.value) setSpecialty(""); }} placeholder="Digite uma especialidade que não esteja na lista" disabled={disabled}/>
    </label>
  </>;
}
