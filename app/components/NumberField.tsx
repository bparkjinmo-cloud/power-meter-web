export function NumberField(props: {
  label: string;
  unit?: string;
  value: number;
  step?: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  const { label, unit, value, step, min, max, onChange } = props;

  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
        {label} {unit ? `(${unit})` : ""}
      </label>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        step={step ?? 1}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ padding: 8, width: 220 }}
      />
    </div>
  );
}
