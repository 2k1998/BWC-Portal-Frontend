// Fetch departments from backend with safe fallback
const DEFAULT_API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";

function buildUrl(path, baseUrl) {
  const root = (baseUrl || DEFAULT_API_URL).replace(/\/$/, "");
  return `${root}${path}`;
}

export async function fetchDepartments(baseUrl) {
  const url = buildUrl("/departments", baseUrl);

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 5000);

  try {
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (!Array.isArray(data)) return [];
    return data
      .filter((d) => d && d.name)
      .map((d) => ({
        id: Number(d.id),
        name: String(d.name).trim(),
      }));
  } catch (err) {
    clearTimeout(timeout);
    console.warn("[departments] Using fallback:", err.message);
    return []; // empty array, handled in UI merge
  }
}

export async function createDepartment(name, token, baseUrl) {
  if (!token) {
    throw new Error("Missing access token");
  }

  const trimmedName = (name || "").trim();
  if (!trimmedName) {
    throw new Error("Department name is required");
  }

  const url = buildUrl("/departments", baseUrl);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name: trimmedName }),
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      if (data && data.detail) detail = data.detail;
    } catch (err) {
      // ignore json parse errors
    }
    throw new Error(detail);
  }

  return res.json();
}
  