function timeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone, year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", second:"2-digit", hourCycle:"h23"
  }).formatToParts(date);
  const values: Record<string,string> = {};
  for (const p of parts) if (p.type !== "literal") values[p.type] = p.value;
  const asUTC = Date.UTC(Number(values.year), Number(values.month)-1, Number(values.day), Number(values.hour), Number(values.minute), Number(values.second));
  return asUTC - date.getTime();
}

export function zonedDateTimeToUtc(date: string, time: string, timeZone = "America/Sao_Paulo") {
  const [y,m,d] = date.split("-").map(Number); const [hh,mm] = time.split(":").map(Number);
  let guess = new Date(Date.UTC(y,m-1,d,hh,mm,0));
  let offset = timeZoneOffsetMs(guess,timeZone);
  let result = new Date(guess.getTime()-offset);
  const offset2 = timeZoneOffsetMs(result,timeZone);
  if (offset2 !== offset) result = new Date(guess.getTime()-offset2);
  return result;
}

export function weekdayInTimeZone(date: string, timeZone = "America/Sao_Paulo") {
  const noon = zonedDateTimeToUtc(date,"12:00",timeZone);
  const short = new Intl.DateTimeFormat("en-US",{timeZone,weekday:"short"}).format(noon);
  return ({Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6} as Record<string,number>)[short];
}
