// ============================================================
// FINANCEOS - TAB-ISOLATED AUTHENTICATION STORAGE
//
// Enforces tab-scoped session isolation using sessionStorage.
// Each browser tab/window maintains its own independent session.
// ============================================================

export const TOKEN_KEY = "financeos_token";
export const USER_KEY = "financeos_user";

// Account-deleted listeners
const accountDeletedListeners = new Set();

/**
 * Register a listener to be notified when the current user account is deleted by an admin.
 */
export function onAccountDeleted(callback) {
  if (typeof callback === "function") {
    accountDeletedListeners.add(callback);
    return () => accountDeletedListeners.delete(callback);
  }
  return () => {};
}

/**
 * Notify all listeners that the current user account has been deleted by an administrator.
 * Clears the current tab's session state immediately.
 */
export function notifyAccountDeleted() {
  try {
    clearAuthSession();
  } catch (_) {}

  accountDeletedListeners.forEach((callback) => {
    try {
      callback();
    } catch (err) {
      console.error("[AUTH] Error in accountDeleted listener:", err);
    }
  });
}

/**
 * Retrieve the JWT auth token for the CURRENT browser tab.
 */
export function getAuthToken() {
  try {
    if (typeof window === "undefined") return null;
    return (
      (window.sessionStorage && sessionStorage.getItem(TOKEN_KEY)) ||
      (window.localStorage && localStorage.getItem(TOKEN_KEY)) ||
      null
    );
  } catch (err) {
    console.error("[AUTH] Error reading tab auth token:", err);
    return null;
  }
}

/**
 * Retrieve the authenticated User object for the CURRENT browser tab.
 */
export function getAuthUser() {
  try {
    if (typeof window === "undefined") return null;
    const raw =
      (window.sessionStorage && sessionStorage.getItem(USER_KEY)) ||
      (window.localStorage && localStorage.getItem(USER_KEY)) ||
      null;
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error("[AUTH] Error reading tab auth user:", err);
    return null;
  }
}

/**
 * Store the authenticated session (JWT token + user object).
 */
export function setAuthSession(token, user, rememberMe = false) {
  try {
    if (typeof window === "undefined") return;

    if (token) {
      if (window.sessionStorage) sessionStorage.setItem(TOKEN_KEY, token);
      if (rememberMe && window.localStorage) localStorage.setItem(TOKEN_KEY, token);
    } else {
      if (window.sessionStorage) sessionStorage.removeItem(TOKEN_KEY);
      if (window.localStorage) localStorage.removeItem(TOKEN_KEY);
    }

    if (user) {
      const userStr = JSON.stringify(user);
      if (window.sessionStorage) sessionStorage.setItem(USER_KEY, userStr);
      if (rememberMe && window.localStorage) localStorage.setItem(USER_KEY, userStr);
    } else {
      if (window.sessionStorage) sessionStorage.removeItem(USER_KEY);
      if (window.localStorage) localStorage.removeItem(USER_KEY);
    }
  } catch (err) {
    console.error("[AUTH] Error saving tab auth session:", err);
  }
}

/**
 * Clear the authentication session for the CURRENT tab only.
 * Other tabs' sessionStorage remains completely untouched.
 */
export function clearAuthSession() {
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
    }
    // Clean up any old cross-tab localStorage entries
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (_) {}
  } catch (err) {
    console.error("[AUTH] Error clearing tab auth session:", err);
  }
}

// ============================================================
// GLOBAL FETCH INTERCEPTOR FOR TAB SESSION INVALIDATION
// Catches 401 ACCOUNT_DELETED immediately across all API calls
// ============================================================
if (typeof window !== "undefined" && !window.__financeos_fetch_interceptor_installed__) {
  window.__financeos_fetch_interceptor_installed__ = true;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (...args) => {
    const response = await originalFetch(...args);

    if (response && response.status === 401) {
      try {
        const cloned = response.clone();
        const data = await cloned.json();
        if (
          data &&
          (data.code === "ACCOUNT_DELETED" ||
            data.message?.includes("account no longer exists"))
        ) {
          notifyAccountDeleted();
        }
      } catch (_) {
        // Not a JSON response or unable to clone/parse
      }
    }

    return response;
  };
}
