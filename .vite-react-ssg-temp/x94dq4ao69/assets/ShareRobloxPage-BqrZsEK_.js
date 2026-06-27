import { n as useTranslation, t as supabase } from "../main.mjs";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Box, Download, ExternalLink } from "lucide-react";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/pages/ShareRobloxPage.tsx
function ShareRobloxPage() {
	const { slug } = useParams();
	const navigate = useNavigate();
	const { t } = useTranslation();
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [downloadingShirt, setDownloadingShirt] = useState(false);
	const [downloadingPants, setDownloadingPants] = useState(false);
	useEffect(() => {
		async function fetchShare() {
			if (!slug) return;
			try {
				const { data: shareData, error: fetchErr } = await supabase.from("shares_roblox").select("*").eq("slug", slug).single();
				if (fetchErr || !shareData) throw new Error("Share link not found or invalid.");
				setData(shareData);
			} catch (err) {
				setError(err.message || "Failed to load share data.");
			} finally {
				setLoading(false);
			}
		}
		fetchShare();
	}, [slug]);
	const handleDownload = async (url, filename, setDownloading) => {
		setDownloading(true);
		try {
			const blob = await (await fetch(url)).blob();
			const objectUrl = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = objectUrl;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(objectUrl);
		} catch (e) {
			console.error("Failed to download file:", e);
		} finally {
			setDownloading(false);
		}
	};
	if (loading) return /* @__PURE__ */ jsxs("div", {
		style: {
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			justifyContent: "center",
			minHeight: "100vh",
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
			children: "Loading shared assets..."
		})]
	});
	if (error || !data) return /* @__PURE__ */ jsx("div", {
		style: {
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			minHeight: "100vh",
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
				gap: "20px"
			},
			children: [
				/* @__PURE__ */ jsx("h2", {
					style: {
						margin: 0,
						color: "#f87171",
						fontSize: "1.5rem",
						fontWeight: 700
					},
					children: "Link Expired or Invalid"
				}),
				/* @__PURE__ */ jsx("p", {
					style: {
						margin: 0,
						color: "#a1a1aa",
						fontSize: "0.95rem",
						lineHeight: "1.5"
					},
					children: error || "The shared conversion doesn't exist."
				}),
				/* @__PURE__ */ jsx("button", {
					className: "glow-btn",
					onClick: () => navigate("/"),
					style: { padding: "12px" },
					children: "Go to Homepage"
				})
			]
		})
	});
	return /* @__PURE__ */ jsx("div", {
		className: "layout-wrapper",
		style: {
			minHeight: "100vh",
			display: "flex",
			flexDirection: "column"
		},
		children: /* @__PURE__ */ jsxs("div", {
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
						children: t("share_title_roblox")
					})] })]
				}), /* @__PURE__ */ jsxs("button", {
					className: "glow-btn-secondary",
					onClick: () => navigate("/roblox"),
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
			}), /* @__PURE__ */ jsxs("main", {
				className: "main-grid",
				style: {
					display: "grid",
					gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
					gap: "24px"
				},
				children: [/* @__PURE__ */ jsxs("section", {
					className: "glass-panel sidebar-panel",
					style: {
						padding: "24px",
						display: "flex",
						flexDirection: "column",
						gap: "24px"
					},
					children: [
						/* @__PURE__ */ jsxs("div", {
							style: {
								display: "flex",
								flexDirection: "column",
								gap: "8px"
							},
							children: [
								/* @__PURE__ */ jsxs("span", {
									className: "badge",
									style: {
										alignSelf: "flex-start",
										fontSize: "0.7rem"
									},
									children: [
										t("dash_share_creator"),
										": ",
										data.creator_name || "Anonymous"
									]
								}),
								/* @__PURE__ */ jsx("h2", {
									style: {
										margin: "4px 0 0 0",
										fontSize: "1.4rem",
										fontWeight: 800
									},
									children: data.creator_name ? `${data.creator_name}'s Outfit` : "Shared Outfit"
								}),
								/* @__PURE__ */ jsx("p", {
									style: {
										margin: 0,
										fontSize: "0.9rem",
										color: "#d1d5db",
										lineHeight: "1.5"
									},
									children: data.description || "No description provided."
								})
							]
						}),
						/* @__PURE__ */ jsx("div", {
							className: "viewer-canvas-container",
							style: {
								minHeight: "320px",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								overflow: "hidden",
								background: "#0c0c0e",
								border: "1px solid rgba(255, 255, 255, 0.05)",
								borderRadius: "8px"
							},
							children: data.preview_url ? /* @__PURE__ */ jsx("img", {
								src: data.preview_url,
								alt: "R6 Avatar Render",
								style: {
									width: "100%",
									height: "100%",
									objectFit: "contain",
									imageRendering: "pixelated"
								}
							}) : /* @__PURE__ */ jsx("div", {
								style: {
									color: "#52525b",
									fontSize: "0.9rem",
									textAlign: "center"
								},
								children: "No 3D Preview Available"
							})
						}),
						/* @__PURE__ */ jsxs("div", {
							style: {
								display: "flex",
								justifyContent: "space-between",
								padding: "12px",
								background: "rgba(255, 255, 255, 0.02)",
								borderRadius: "8px",
								border: "1px solid rgba(255, 255, 255, 0.05)"
							},
							children: [/* @__PURE__ */ jsx("span", {
								style: {
									fontSize: "0.9rem",
									color: "#a1a1aa"
								},
								children: t("arm_type")
							}), /* @__PURE__ */ jsx("span", {
								style: {
									fontSize: "0.9rem",
									fontWeight: 600,
									color: "#818cf8",
									textTransform: "capitalize"
								},
								children: data.arm_type === "alex" ? t("arm_slim") : t("arm_classic")
							})]
						}),
						/* @__PURE__ */ jsxs("button", {
							className: "glow-btn",
							onClick: () => {
								if (data.skin_url) navigate(`/roblox?skinUrl=${encodeURIComponent(data.skin_url)}`);
								else navigate("/roblox");
							},
							style: {
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								gap: "8px",
								padding: "12px",
								background: "linear-gradient(135deg, #818cf8 0%, #6366f1 100%)"
							},
							children: [
								/* @__PURE__ */ jsx(ExternalLink, { size: 18 }),
								" ",
								t("share_open_app"),
								" → /roblox"
							]
						})
					]
				}), /* @__PURE__ */ jsxs("section", {
					className: "glass-panel viewer-panel",
					style: {
						padding: "24px",
						display: "flex",
						flexDirection: "column",
						gap: "24px"
					},
					children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", {
						style: {
							margin: "0 0 6px 0",
							fontSize: "1.25rem",
							fontWeight: 700
						},
						children: "Roblox Classic Templates"
					}), /* @__PURE__ */ jsx("p", {
						style: {
							margin: 0,
							fontSize: "0.85rem",
							color: "#a1a1aa"
						},
						children: "Upload these templates to Roblox to publish your classic clothing assets."
					})] }), /* @__PURE__ */ jsxs("div", {
						style: {
							display: "grid",
							gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
							gap: "24px"
						},
						children: [/* @__PURE__ */ jsxs("div", {
							className: "template-card",
							style: {
								display: "flex",
								flexDirection: "column",
								gap: "12px",
								alignItems: "center",
								background: "rgba(255,255,255,0.01)",
								border: "1px solid rgba(255,255,255,0.05)",
								borderRadius: "8px",
								padding: "16px"
							},
							children: [
								/* @__PURE__ */ jsx("h3", {
									style: {
										fontSize: "0.95rem",
										margin: 0,
										fontWeight: 600
									},
									children: t("template_shirt_title")
								}),
								/* @__PURE__ */ jsx("div", {
									style: {
										width: "100%",
										height: "180px",
										display: "flex",
										justifyContent: "center",
										background: "rgba(0,0,0,0.2)",
										border: "1px solid rgba(255,255,255,0.05)",
										borderRadius: "4px",
										overflow: "hidden"
									},
									children: /* @__PURE__ */ jsx("img", {
										src: data.shirt_url,
										alt: "Shirt Template",
										style: {
											maxWidth: "100%",
											maxHeight: "100%",
											objectFit: "contain"
										}
									})
								}),
								/* @__PURE__ */ jsxs("button", {
									className: "glow-btn-roblox",
									style: {
										width: "100%",
										padding: "10px"
									},
									onClick: () => handleDownload(data.shirt_url, "skinbridge_shirt.png", setDownloadingShirt),
									disabled: downloadingShirt,
									children: [
										/* @__PURE__ */ jsx(Download, { size: 16 }),
										" ",
										downloadingShirt ? "Downloading..." : t("btn_download_shirt")
									]
								})
							]
						}), /* @__PURE__ */ jsxs("div", {
							className: "template-card",
							style: {
								display: "flex",
								flexDirection: "column",
								gap: "12px",
								alignItems: "center",
								background: "rgba(255,255,255,0.01)",
								border: "1px solid rgba(255,255,255,0.05)",
								borderRadius: "8px",
								padding: "16px"
							},
							children: [
								/* @__PURE__ */ jsx("h3", {
									style: {
										fontSize: "0.95rem",
										margin: 0,
										fontWeight: 600
									},
									children: t("template_pants_title")
								}),
								/* @__PURE__ */ jsx("div", {
									style: {
										width: "100%",
										height: "180px",
										display: "flex",
										justifyContent: "center",
										background: "rgba(0,0,0,0.2)",
										border: "1px solid rgba(255,255,255,0.05)",
										borderRadius: "4px",
										overflow: "hidden"
									},
									children: /* @__PURE__ */ jsx("img", {
										src: data.pants_url,
										alt: "Pants Template",
										style: {
											maxWidth: "100%",
											maxHeight: "100%",
											objectFit: "contain"
										}
									})
								}),
								/* @__PURE__ */ jsxs("button", {
									className: "glow-btn-roblox",
									style: {
										width: "100%",
										padding: "10px"
									},
									onClick: () => handleDownload(data.pants_url, "skinbridge_pants.png", setDownloadingPants),
									disabled: downloadingPants,
									children: [
										/* @__PURE__ */ jsx(Download, { size: 16 }),
										" ",
										downloadingPants ? "Downloading..." : t("btn_download_pants")
									]
								})
							]
						})]
					})]
				})]
			})]
		})
	});
}
//#endregion
export { ShareRobloxPage as default };
