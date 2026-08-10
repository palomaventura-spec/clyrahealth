"use client";

import { useMemo, useState } from "react";

const TYPES = [
  ["DOCTOR","Médico(a)"],
  ["DENTIST","Dentista"],
  ["PHYSIOTHERAPIST","Fisioterapeuta"],
  ["PSYCHOLOGIST","Psicólogo(a)"],
  ["NUTRITIONIST","Nutricionista"],
  ["SPEECH_THERAPIST","Fonoaudiólogo(a)"],
  ["OTHER","Outro profissional de saúde"]
] as const;

const SPECIALTIES: Record<string,string[]> = {
  DOCTOR:["Clínica Médica","Cardiologia","Dermatologia","Endocrinologia","Gastroenterologia","Geriatria","Ginecologia e Obstetrícia","Neurologia","Oftalmologia","Ortopedia e Traumatologia","Otorrinolaringologia","Pediatria","Pneumologia","Psiquiatria","Reumatologia","Urologia"],
  DENTIST:["Clínica Geral","Cirurgia Bucomaxilofacial","Dentística","Endodontia","Implantodontia","Odontopediatria","Ortodontia","Periodontia","Prótese Dentária"],
  PHYSIOTHERAPIST:["Fisioterapia Traumato-Ortopédica","Fisioterapia Esportiva","Fisioterapia Neurológica","Fisioterapia Respiratória","Fisioterapia Pélvica","Fisioterapia Pediátrica","Fisioterapia Geriátrica","Fisioterapia Dermatofuncional"],
  PSYCHOLOGIST:["Psicologia Clínica","Psicologia Infantil","Psicologia do Adolescente","Psicologia Hospitalar","Neuropsicologia","Psicologia Organizacional","Terapia de Casal e Família"],
  NUTRITIONIST:["Nutrição Clínica","Nutrição Esportiva","Nutrição Materno-Infantil","Nutrição Funcional","Nutrição Comportamental","Nutrição Geriátrica"],
  SPEECH_THERAPIST:["Audiologia","Disfagia","Fonoaudiologia Educacional","Fonoaudiologia Neurofuncional","Linguagem","Motricidade Orofacial","Voz"],
  OTHER:[]
};

export function ProfessionalClinicalFields({
  defaultType="DOCTOR",
  defaultSpecialty="",
  disabled=false
}:{
  defaultType?:string;
  defaultSpecialty?:string;
  disabled?:boolean;
}) {
  const [type,setType]=useState(defaultType);
  const options=useMemo(()=>SPECIALTIES[type]??[],[type]);
  const [preset,setPreset]=useState(options.includes(defaultSpecialty)?defaultSpecialty:"");
  const [custom,setCustom]=useState(defaultSpecialty&&!options.includes(defaultSpecialty)?defaultSpecialty:"");

  return <>
    <label>Profissão
      <select name="type" value={type} disabled={disabled}
        onChange={e=>{setType(e.target.value);setPreset("");setCustom("");}}>
        {TYPES.map(([value,label])=><option key={value} value={value}>{label}</option>)}
      </select>
      {disabled&&<input type="hidden" name="type" value={type}/>}
    </label>

    <label>Especialidade
      <select key={type} name="specialtyPreset" value={preset}
        disabled={disabled||options.length===0}
        onChange={e=>{setPreset(e.target.value);if(e.target.value)setCustom("");}}>
        <option value="">{options.length?"Selecione a especialidade":"Use o campo abaixo"}</option>
        {options.map(name=><option key={`${type}-${name}`} value={name}>{name}</option>)}
      </select>
      <small className="field-help">As opções mudam conforme a profissão escolhida.</small>
    </label>

    <label className="span-2">Outra especialidade / área de atuação
      <input name="newSpecialtyName" value={custom} disabled={disabled}
        onChange={e=>{setCustom(e.target.value);if(e.target.value)setPreset("");}}
        placeholder="Digite uma especialidade que não esteja na lista"/>
      <small className="field-help">Use apenas se a área desejada não estiver na lista.</small>
    </label>

    {disabled&&defaultSpecialty&&<input type="hidden" name="currentSpecialtyName" value={defaultSpecialty}/>}
  </>;
}
