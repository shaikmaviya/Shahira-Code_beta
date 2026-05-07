export const ROUTE_PATHS = {
  home: "/",
  problems: "/problems",
  profile: "/profile",
  playground: "/playground",
  contact: "/contact",
  login: "/login",
  signup: "/signup"
};

const ROUTE_PATH_SET = new Set(Object.values(ROUTE_PATHS));
const ROUTE_STATE_BY_PATH = Object.values(ROUTE_PATHS).reduce((acc, path) => {
  acc[path] = {
    isProblemsOpen: path === ROUTE_PATHS.problems,
    isProfileOpen: path === ROUTE_PATHS.profile,
    isPlaygroundOpen: path === ROUTE_PATHS.playground,
    isContactOpen: path === ROUTE_PATHS.contact,
    authPage: path === ROUTE_PATHS.login ? "login" : path === ROUTE_PATHS.signup ? "signup" : "none"
  };
  return acc;
}, {});

export function normalizePath(pathname) {
  if (!pathname || pathname === "/") {
    return "/";
  }

  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

export function resolveRouteState(pathname) {
  const normalizedPath = normalizePath(pathname);
  const resolvedPath = ROUTE_PATH_SET.has(normalizedPath) ? normalizedPath : ROUTE_PATHS.home;
  const baseState = ROUTE_STATE_BY_PATH[resolvedPath] ?? ROUTE_STATE_BY_PATH[ROUTE_PATHS.home];

  return {
    normalizedPath,
    resolvedPath,
    shouldReplace: resolvedPath !== normalizedPath,
    ...baseState
  };
}
