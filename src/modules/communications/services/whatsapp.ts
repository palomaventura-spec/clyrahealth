export async function sendWhatsAppMessage({to,body}:{to:string;body:string}){
 const provider=process.env.WHATSAPP_PROVIDER??"mock";
 if(provider==="mock"){console.log("[WHATSAPP MOCK]",{to,body});return {ok:true,providerId:`mock-${Date.now()}`};}
 const id=process.env.WHATSAPP_PHONE_NUMBER_ID, token=process.env.WHATSAPP_ACCESS_TOKEN, version=process.env.WHATSAPP_GRAPH_API_VERSION??"v23.0";
 if(!id||!token)return {ok:false,error:"WhatsApp não configurado."};
 const r=await fetch(`https://graph.facebook.com/${version}/${id}/messages`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({messaging_product:"whatsapp",to,type:"text",text:{body}})});
 const data=await r.json().catch(()=>({})); if(!r.ok)return {ok:false,error:(data as any)?.error?.message??"Falha no WhatsApp."};
 return {ok:true,providerId:(data as any)?.messages?.[0]?.id??null};
}
