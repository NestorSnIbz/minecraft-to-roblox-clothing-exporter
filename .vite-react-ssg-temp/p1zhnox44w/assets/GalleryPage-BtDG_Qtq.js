import { n as useTranslation, t as supabase } from "../main.mjs";
import { Head } from "vite-react-ssg";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Box, ExternalLink } from "lucide-react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
//#region src/pages/GalleryPage.tsx
function GalleryPage() {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	useEffect(() => {
		async function fetchGallery() {
			try {
				const sevenDaysAgo = /* @__PURE__ */ new Date();
				sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
				const { data: fetchResult, error: fetchErr } = await supabase.from("shares_all").select("*").gte("created_at", sevenDaysAgo.toISOString()).order("created_at", { ascending: false });
				if (fetchErr) throw fetchErr;
				setItems(fetchResult || []);
			} catch (err) {
				console.error("Failed to fetch gallery shares:", err);
				setError(err.message || "Failed to load gallery items.");
			} finally {
				setLoading(false);
			}
		}
		fetchGallery();
	}, []);
	function formatRelativeTime(dateStr) {
		const date = new Date(dateStr);
		const diffMs = (/* @__PURE__ */ new Date()).getTime() - date.getTime();
		const diffMins = Math.max(0, Math.floor(diffMs / 6e4));
		const diffHours = Math.floor(diffMins / 60);
		const diffDays = Math.floor(diffHours / 24);
		if (diffMins < 1) return "Just now";
		if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
		if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
		return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
	}
	return /* @__PURE__ */ jsxs("div", {
		className: "layout-wrapper",
		style: {
			minHeight: "100vh",
			display: "flex",
			flexDirection: "column"
		},
		children: [/* @__PURE__ */ jsxs(Head, { children: [
			/* @__PURE__ */ jsx("title", { children: "Community Gallery | SkinBridge" }),
			/* @__PURE__ */ jsx("meta", {
				name: "description",
				content: "Browse 3D heads, Roblox outfit templates, and character skins shared by the SkinBridge community in the last 7 days."
			}),
			/* @__PURE__ */ jsx("meta", {
				property: "og:title",
				content: "Community Gallery | SkinBridge"
			}),
			/* @__PURE__ */ jsx("meta", {
				property: "og:description",
				content: "Browse 3D heads, Roblox outfit templates, and character skins shared by the SkinBridge community in the last 7 days."
			}),
			/* @__PURE__ */ jsx("link", {
				rel: "canonical",
				href: "https://skinbridge.vercel.app/gallery"
			})
		] }), /* @__PURE__ */ jsxs("div", {
			className: "app-container",
			style: {
				flexGrow: 1,
				padding: "24px 0",
				maxWidth: "1200px",
				margin: "0 auto",
				width: "90%"
			},
			children: [/* @__PURE__ */ jsxs("header", {
				className: "glass-panel app-header",
				style: {
					marginBottom: "32px",
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center"
				},
				children: [/* @__PURE__ */ jsxs("div", {
					className: "logo-container",
					onClick: () => navigate("/"),
					style: { cursor: "pointer" },
					children: [/* @__PURE__ */ jsx(Box, {
						className: "logo-icon",
						size: 32,
						style: { color: "#818cf8" }
					}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
						className: "logo-text",
						style: { margin: 0 },
						children: "SkinBridge"
					}), /* @__PURE__ */ jsx("p", {
						style: {
							margin: 0,
							fontSize: "0.8rem",
							color: "#a1a1aa"
						},
						children: "Community Gallery"
					})] })]
				}), /* @__PURE__ */ jsxs("button", {
					className: "glow-btn-secondary",
					onClick: () => navigate("/dashboard"),
					style: {
						display: "flex",
						alignItems: "center",
						gap: "8px",
						padding: "8px 16px"
					},
					children: [
						/* @__PURE__ */ jsx(ArrowLeft, { size: 16 }),
						" ",
						t("nav_dashboard")
					]
				})]
			}), loading ? /* @__PURE__ */ jsxs("div", {
				style: {
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					minHeight: "50vh",
					gap: "16px"
				},
				children: [/* @__PURE__ */ jsx("div", { style: {
					width: "40px",
					height: "40px",
					borderRadius: "50%",
					border: "3px solid rgba(129, 140, 248, 0.2)",
					borderTopColor: "#818cf8",
					animation: "spin 1s linear infinite"
				} }), /* @__PURE__ */ jsx("p", {
					style: {
						color: "#a1a1aa",
						fontSize: "0.95rem"
					},
					children: "Loading gallery..."
				})]
			}) : error ? /* @__PURE__ */ jsx("div", {
				style: {
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					minHeight: "60vh",
					padding: "20px"
				},
				children: /* @__PURE__ */ jsxs("div", {
					className: "glass-panel",
					style: {
						padding: "32px",
						maxWidth: "400px",
						width: "100%",
						textAlign: "center",
						display: "flex",
						flexDirection: "column",
						gap: "16px"
					},
					children: [
						/* @__PURE__ */ jsx("h3", {
							style: {
								margin: 0,
								color: "#f87171",
								fontSize: "1.25rem",
								fontWeight: 700
							},
							children: "Error Loading Gallery"
						}),
						/* @__PURE__ */ jsx("p", {
							style: {
								margin: 0,
								color: "#a1a1aa",
								fontSize: "0.95rem"
							},
							children: error || "Failed to load gallery items."
						}),
						/* @__PURE__ */ jsx("button", {
							className: "glow-btn",
							onClick: () => window.location.reload(),
							style: { padding: "10px" },
							children: "Retry"
						})
					]
				})
			}) : items.length === 0 ? /* @__PURE__ */ jsx("div", {
				style: {
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					minHeight: "60vh",
					padding: "20px"
				},
				children: /* @__PURE__ */ jsxs("div", {
					className: "glass-panel",
					style: {
						padding: "40px",
						maxWidth: "400px",
						width: "100%",
						textAlign: "center",
						display: "flex",
						flexDirection: "column",
						gap: "20px"
					},
					children: [
						/* @__PURE__ */ jsx("h3", {
							style: {
								margin: 0,
								fontSize: "1.25rem",
								fontWeight: 700
							},
							children: "No shared conversions yet"
						}),
						/* @__PURE__ */ jsx("p", {
							style: {
								margin: 0,
								color: "#a1a1aa",
								fontSize: "0.95rem",
								lineHeight: "1.5"
							},
							children: "Be the first to share!"
						}),
						/* @__PURE__ */ jsx("button", {
							className: "glow-btn",
							onClick: () => navigate("/dashboard"),
							style: { padding: "12px" },
							children: "Go to Dashboard"
						})
					]
				})
			}) : /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs("div", {
				style: {
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: "24px",
					flexWrap: "wrap",
					gap: "12px"
				},
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", {
					style: {
						margin: 0,
						fontSize: "2rem",
						fontWeight: 800,
						background: "linear-gradient(135deg, #a5b4fc 0%, #818cf8 100%)",
						WebkitBackgroundClip: "text",
						WebkitTextFillColor: "transparent"
					},
					children: "Community Gallery"
				}), /* @__PURE__ */ jsx("p", {
					style: {
						margin: "4px 0 0 0",
						color: "#a1a1aa",
						fontSize: "1rem"
					},
					children: "Conversions shared in the last 7 days"
				})] }), /* @__PURE__ */ jsxs("span", {
					className: "badge",
					style: {
						fontSize: "0.85rem",
						padding: "6px 12px"
					},
					children: [items.length, " items"]
				})]
			}), /* @__PURE__ */ jsx("div", {
				style: {
					display: "grid",
					gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
					gap: "24px"
				},
				children: items.map((item) => /* @__PURE__ */ jsxs("div", {
					className: "glass-panel",
					style: {
						display: "flex",
						flexDirection: "column",
						overflow: "hidden",
						height: "100%",
						padding: "16px",
						gap: "16px",
						transition: "transform 0.2s ease, box-shadow 0.2s ease"
					},
					children: [
						/* @__PURE__ */ jsxs("div", {
							style: {
								height: "220px",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								background: "#0c0c0e",
								border: "1px solid rgba(255, 255, 255, 0.05)",
								borderRadius: "12px",
								overflow: "hidden",
								position: "relative"
							},
							children: [/* @__PURE__ */ jsx("img", {
								src: item.preview_url || item.skin_url,
								alt: item.creator_name || "Shared skin",
								style: {
									width: "100%",
									height: "100%",
									objectFit: "contain",
									imageRendering: "pixelated"
								}
							}), /* @__PURE__ */ jsx("span", {
								className: "badge",
								style: {
									position: "absolute",
									top: "12px",
									right: "12px",
									backgroundColor: item.type === "roblox" ? "rgba(129, 140, 248, 0.15)" : "rgba(52, 211, 153, 0.15)",
									borderColor: item.type === "roblox" ? "#818cf8" : "#34d399",
									color: item.type === "roblox" ? "#818cf8" : "#34d399",
									fontSize: "0.7rem",
									padding: "4px 8px"
								},
								children: item.type === "roblox" ? "Roblox Outfit" : "3D Head"
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							style: {
								display: "flex",
								flexDirection: "column",
								gap: "8px",
								flexGrow: 1
							},
							children: [/* @__PURE__ */ jsxs("div", {
								style: {
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center"
								},
								children: [/* @__PURE__ */ jsxs("span", {
									style: {
										fontSize: "0.8rem",
										color: "#a1a1aa",
										fontWeight: 600
									},
									children: ["@", item.creator_name || "Anonymous"]
								}), /* @__PURE__ */ jsx("span", {
									style: {
										fontSize: "0.75rem",
										color: "#71717a"
									},
									children: formatRelativeTime(item.created_at)
								})]
							}), /* @__PURE__ */ jsx("p", {
								style: {
									margin: 0,
									fontSize: "0.85rem",
									color: "#e4e4e7",
									lineHeight: "1.45",
									display: "-webkit-box",
									WebkitLineClamp: 2,
									WebkitBoxOrient: "vertical",
									overflow: "hidden",
									textOverflow: "ellipsis",
									height: "2.9em"
								},
								children: item.description || "No description provided."
							})]
						}),
						/* @__PURE__ */ jsxs("button", {
							className: "glow-btn",
							onClick: () => navigate(item.type === "roblox" ? `/share/roblox/${item.slug}` : `/share/head3d/${item.slug}`),
							style: {
								width: "100%",
								padding: "10px 0",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								gap: "8px"
							},
							children: ["View ", /* @__PURE__ */ jsx(ExternalLink, { size: 14 })]
						})
					]
				}, item.slug))
			})] })]
		})]
	});
}
//#endregion
export { GalleryPage as default };
