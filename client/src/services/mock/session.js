/**
 * The signed-in account.
 *
 * A fixture until there is a backend. It is a module constant rather than a
 * fetch because nothing in the shell should be built around a loading state
 * that will not exist: when this becomes real it will be resolved on the server
 * and handed to the layout as a prop, and every component below reads the same
 * shape either way.
 *
 * There is no guard on `/dashboard`. That is correct for this phase — there is
 * nothing to authenticate against — and `requireSession` below is the single
 * place the real check will go.
 */
export const SESSION = {
  id: "usr_mock",
  name: "Alex Rivera",
  email: "alex@datadock.app",
  initials: "AR",
  plan: "Pro",
};

/**
 * @returns {Promise<typeof SESSION>}
 *
 * The seam. Today it hands back the fixture; with a backend it verifies the
 * cookie and redirects to `/login` when there isn't one.
 */
export async function requireSession() {
  return SESSION;
}
