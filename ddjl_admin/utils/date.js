export function toISODate(d) {
  const x = d instanceof Date ? d : new Date(d);
  return x.toISOString().split("T")[0];
}

export function todayISO() {
  return toISODate(new Date());
}

export function addDaysISO(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return toISODate(d);
}

