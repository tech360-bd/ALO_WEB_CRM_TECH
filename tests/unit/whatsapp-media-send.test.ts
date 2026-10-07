// §131 — outbound attachment send via the official WhatsApp Cloud API
import { describe, it, expect } from "vitest";
import {
  buildWhatsAppMediaPayload,
  validateWhatsAppMediaRequest,
  whatsappCloudConfigError,
  WHATSAPP_MEDIA_TYPES,
} from "@/lib/whatsapp-media";

describe("buildWhatsAppMediaPayload (official Cloud API media-by-link)", () => {
  it("builds a document payload with filename + caption", () => {
    const p = buildWhatsAppMediaPayload("8801712345678", {
      to: "x",
      mediaType: "document",
      link: "https://files.example.com/offer.pdf",
      fileName: "offer.pdf",
      caption: "Your offer letter",
    });
    expect(p.type).toBe("document");
    expect(p.messaging_product).toBe("whatsapp");
    const doc = p.document as Record<string, unknown>;
    expect(doc.link).toBe("https://files.example.com/offer.pdf");
    expect(doc.filename).toBe("offer.pdf");
    expect(doc.caption).toBe("Your offer letter");
  });

  it("builds an image payload; audio never carries a caption", () => {
    const img = buildWhatsAppMediaPayload("8801712345678", {
      to: "x", mediaType: "image", link: "https://files.example.com/pic.png", caption: "hi",
    });
    expect((img.image as any).caption).toBe("hi");
    const aud = buildWhatsAppMediaPayload("8801712345678", {
      to: "x", mediaType: "audio", link: "https://files.example.com/a.mp3", caption: "no",
    });
    expect((aud.audio as any).caption).toBeUndefined();
  });

  it("exposes exactly the 4 official media types", () => {
    expect(WHATSAPP_MEDIA_TYPES).toEqual(["document", "image", "audio", "video"]);
  });
});

describe("media request validation + honest failure modes (no fabrication)", () => {
  it("fails truthfully when Cloud API credentials are not configured", () => {
    expect(whatsappCloudConfigError()).toContain("not configured");
  });

  it("rejects non-https links before any network call", () => {
    const v = validateWhatsAppMediaRequest({
      to: "01712345678", mediaType: "image", link: "http://insecure.example.com/x.png",
    });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.error).toMatch(/https/i);
  });

  it("rejects unsupported media types", () => {
    const v = validateWhatsAppMediaRequest({
      to: "01712345678", mediaType: "sticker" as any, link: "https://files.example.com/x.webp",
    });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.error).toMatch(/mediaType/);
  });

  it("accepts a valid document request", () => {
    expect(validateWhatsAppMediaRequest({
      to: "01712345678", mediaType: "document", link: "https://files.example.com/x.pdf",
    }).ok).toBe(true);
  });
});
