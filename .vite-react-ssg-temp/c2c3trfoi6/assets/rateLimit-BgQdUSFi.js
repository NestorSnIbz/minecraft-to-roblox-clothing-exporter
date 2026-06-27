//#region src/lib/rateLimit.ts
var EDGE_FUNCTION_URL = `https://ekomnjcvedstogjnzfht.supabase.co/functions/v1/check-rate-limit`;
var ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrb21uamN2ZWRzdG9nam56Zmh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwOTAyMDMsImV4cCI6MjA5NzY2NjIwM30.0l2A30Na2uBoj5Dvb4uA-q8ioun1kdE_Udeoo-HfZoU";
var RateLimitError = class extends Error {
	minutesLeft;
	constructor(message, minutesLeft) {
		super(message);
		this.name = "RateLimitError";
		this.minutesLeft = minutesLeft;
	}
};
async function checkRateLimit(workspace) {
	try {
		const res = await fetch(EDGE_FUNCTION_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				apikey: ANON_KEY,
				Authorization: `Bearer ${ANON_KEY}`
			},
			body: JSON.stringify({ workspace })
		});
		const result = await res.json();
		if (res.status === 429) {
			const mins = result.minutesLeft ?? 1;
			throw new RateLimitError(`Too many shares. Please wait ${mins} minute${mins !== 1 ? "s" : ""} before sharing again.`, mins);
		}
		if (!res.ok) throw new Error(result.message ?? "Failed to verify rate limit. Please try again.");
	} catch (err) {
		if (err instanceof RateLimitError) throw err;
		console.warn("[checkRateLimit] Network error, skipping check:", err);
	}
}
//#endregion
export { checkRateLimit as n, RateLimitError as t };
