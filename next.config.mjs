/** @type {import("next").NextConfig} */
export default {
	// Same-origin proxy so the API's session cookie works without CORS.
	rewrites: async () => [
		{
			source: "/api/:path*",
			destination: `${process.env.API_URL ?? "http://localhost:4000"}/:path*`,
		},
	],
};
