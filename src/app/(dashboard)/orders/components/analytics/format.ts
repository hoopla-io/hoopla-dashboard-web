export const formatSeconds = (sec: number | null) => {
  if (sec == null) return "—";
  if (sec < 90) return `${Math.round(sec)} s`;
  return `${(sec / 60).toFixed(1)} min`;
};

export const formatMinutes = (min: number | null) => (min == null ? "—" : `${min.toFixed(1)} min`);
