// frontend/src/api/client.js'den uyarlanmis. Web'de BASE_URL sabit '/api' (Vite proxy
// uzerinden), mobilde ise LAN IP'si build zamaninda bilinmedigi icin degistirilebilir
// bir singleton olarak tutulur (ServerConfigContext tarafindan set edilir).

let baseUrl = null;
let token = null;

export function setBaseUrl(url) {
  baseUrl = url;
}

export function setToken(nextToken) {
  token = nextToken;
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  if (!baseUrl) {
    throw new Error('Sunucu adresi henuz ayarlanmadi.');
  }

  const headers = { 'Content-Type': 'application/json' };
  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const error = new Error((data && data.error) || 'Bir hata oluştu.');
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: { username, password }, auth: false }),
};

export async function checkServerReachable(url) {
  try {
    const res = await fetch(`${url}/tables`, { method: 'GET' });
    // 401 (auth yok) da sunucunun ayakta ve dogru API oldugunu kanitlar.
    return res.status === 401 || res.ok;
  } catch {
    return false;
  }
}
