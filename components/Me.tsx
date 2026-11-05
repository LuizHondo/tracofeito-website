"use client";
import { usePathname, useRouter } from "next/navigation";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";
import { getMe, type Me } from "../lib/api";
import { signInUrl } from "../lib/nav";

type State = { me: Me | null; ready: boolean; setMe: (m: Me | null) => void };
const MeCtx = createContext<State>({ me: null, ready: false, setMe: () => {} });
export const useMe = () => useContext(MeCtx);

/** Loads the session once; every screen reads it from here. */
export function MeProvider({ children }: { children: ReactNode }) {
	const [me, setMe] = useState<Me | null>(null);
	const [ready, setReady] = useState(false);
	useEffect(() => {
		getMe()
			.then(setMe)
			.catch(() => setMe(null))
			.finally(() => setReady(true));
	}, []);
	return (
		<MeCtx.Provider value={{ me, ready, setMe }}>{children}</MeCtx.Provider>
	);
}

/** Route guard: sends visitors to sign-in and back. Returns the user once known. */
export function useRequireUser(): Me | null {
	const { me, ready } = useMe();
	const router = useRouter();
	const path = usePathname();
	useEffect(() => {
		if (ready && !me) router.replace(signInUrl(path));
	}, [ready, me, router, path]);
	return me;
}
