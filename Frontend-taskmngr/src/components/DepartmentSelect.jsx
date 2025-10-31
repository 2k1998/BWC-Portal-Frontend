import { useEffect, useMemo, useState } from "react";
import { fetchDepartments } from "../services/departments";

const HARDCODED_DEPTS = [
  "Ενέργεια",
  "Ασφάλειες",
  "Ακαδημία Αυτοβελτίωσης",
  "Ακίνητα",
  "Επενδύσεις",
  "Marketing/Κοινωνικά Δίκτυα",
];

function mergeUnique(base, extras) {
  const set = new Set(base.map((x) => x.toLowerCase().trim()));
  const merged = [...base];
  for (const name of extras) {
    const key = name.toLowerCase().trim();
    if (!set.has(key) && name.trim()) {
      set.add(key);
      merged.push(name.trim());
    }
  }
  return merged;
}

export function DepartmentSelect({
  value,
  onChange,
  placeholder = "Επιλέξτε τμήμα...",
  name = "department",
  id = "department",
  className = "form-select",
}) {
  const [apiDepts, setApiDepts] = useState([]);

  useEffect(() => {
    fetchDepartments()
      .then((list) => {
        setApiDepts(list.map((d) => d.name));
      })
      .catch(() => {
        setApiDepts([]);
      });
  }, []);

  const options = useMemo(
    () => mergeUnique(HARDCODED_DEPTS, apiDepts),
    [apiDepts]
  );

  return (
    <select
      id={id}
      name={name}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    >
      <option value="">{placeholder}</option>
      {options.map((label) => (
        <option key={label} value={label}>
          {label}
        </option>
      ))}
    </select>
  );
}

export default DepartmentSelect;

