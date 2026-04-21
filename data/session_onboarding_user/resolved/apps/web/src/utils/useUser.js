import * as React from "react";
import { useSession } from "@auth/create/react";

const useUser = () => {
  const { data: session, status } = useSession();
  const sessionUser = session?.user ?? null;

  const [user, setUser] = React.useState(sessionUser);
  const [loadingProfile, setLoadingProfile] = React.useState(false);

  const triedProfileFallbackRef = React.useRef(false);

  const fetchProfile = React.useCallback(async () => {
    try {
      setLoadingProfile(true);
      const res = await fetch("/api/profile", {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        console.warn(
          `useUser: /api/profile returned [${res.status}] ${res.statusText}`,
        );
        return null;
      }

      const data = await res.json();
      return data.user ?? null;
    } catch (err) {
      console.error("useUser: failed to fetch /api/profile", err);
      return null;
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  React.useEffect(() => {
    // While Auth.js is loading, keep the UI in a loading state.
    if (status === "loading") {
      return;
    }

    // Normal happy path.
    if (status === "authenticated") {
      triedProfileFallbackRef.current = false;
      setUser(sessionUser);

      // Fetch richer profile (role, 2FA flags, etc.)
      fetchProfile().then((profileUser) => {
        if (profileUser) {
          setUser(profileUser);
        } else {
          // Keep at least session user so UI doesn't act like we "logged out".
          setUser(sessionUser);
        }
      });

      return;
    }

    // Some environments briefly report unauthenticated during navigation.
    // If we have a valid cookie, /api/profile may still return 200.
    if (status === "unauthenticated") {
      if (triedProfileFallbackRef.current) {
        setUser(null);
        return;
      }

      triedProfileFallbackRef.current = true;

      fetchProfile().then((profileUser) => {
        if (profileUser) {
          setUser(profileUser);
        } else {
          setUser(null);
        }
      });

      return;
    }

    setUser(null);
  }, [fetchProfile, sessionUser, status]);

  const loading = status === "loading" || loadingProfile;

  const refetch = React.useCallback(async () => {
    const profileUser = await fetchProfile();
    setUser(profileUser ?? sessionUser);
  }, [fetchProfile, sessionUser]);

  return {
    user,
    data: user,
    loading,
    refetch,
  };
};

export { useUser };
export default useUser;
