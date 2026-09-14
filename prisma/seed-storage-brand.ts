// ALO Education — Storage & Brand Seed (Task 22) — Portable 2026-09-15
// Seeds the three storage pools, the default brand profile,
// and 10 marketing model profiles + 4 voice profiles.
// Idempotent via upsert. Storage paths now portable (STORAGE_ROOT env or ./storage).

import { PrismaClient } from "@prisma/client";
import * as path from "path";
const db = new PrismaClient();

async function main() {
  console.log("=== ALO Storage & Brand Seed (Task 22) ===\n");

  // 1. Initialize storage pools (portable: project-root/storage, fallback /home/z legacy)
  const storageRoot = process.env.STORAGE_ROOT || path.resolve(process.cwd(), "storage");
  const pools = [
    {
      poolKey: "STUDENT_PARTNER",
      name: "Student & Partner Private Storage",
      description: "Student documents, partner documents, passports, certificates, financial docs. Pool A (~120GB SSD).",
      mountPath: `${storageRoot}/student-partner`,
      capacityBytes: 120 * 1024 * 1024 * 1024,
    },
    {
      poolKey: "OFFICIAL",
      name: "ALO Official Documents & Project Archives",
      description: "Company policies, SOPs, Knowledge Center, brand assets, project archives. Pool B (~120GB SSD).",
      mountPath: `${storageRoot}/official`,
      capacityBytes: 120 * 1024 * 1024 * 1024,
    },
    {
      poolKey: "OPERATIONAL",
      name: "Employee & Production & General Operational Storage",
      description: "Employee work files, marketing media, AI-generated media, reports. Pool C (~500GB HDD).",
      mountPath: `${storageRoot}/operational`,
      capacityBytes: 500 * 1024 * 1024 * 1024,
    },
  ];

  for (const p of pools) {
    await db.storagePool.upsert({
      where: { poolKey: p.poolKey },
      update: { name: p.name, description: p.description, mountPath: p.mountPath, capacityBytes: p.capacityBytes },
      create: { ...p, status: "HEALTHY" },
    });
    console.log(`  ✓ Pool: ${p.poolKey} (${p.name})`);
  }

  // 2. Default Brand Profile
  const brand = await db.brandProfile.upsert({
    where: { id: "default-brand-profile" },
    update: {},
    create: {
      id: "default-brand-profile",
      name: "ALO Education",
      primaryColor: "#F37021", // ALO Orange
      secondaryColor: "#0066CC", // Education Blue
      accentColor: "#FFB347", // Sunshine Accent
      tagline: "Your Gateway to Global Education",
      website: "https://aloeducation.com",
      phone: "01805020101",
      email: "info@aloeducation.com",
      address: "Dhaka, Bangladesh",
      facebookHandle: "aloeducation",
      instagramHandle: "aloeducation",
      linkedinHandle: "aloeducation",
      youtubeHandle: "aloeducation",
      legalDisclaimer: "ALO Education is a study abroad consultancy. We do not guarantee university admission or visa approval. All information is subject to official university and government sources.",
      primaryFont: "Inter",
      headingFont: "Inter",
      isActive: true,
      version: 1,
    },
  });
  console.log(`  ✓ Brand profile: ${brand.name} (orange: ${brand.primaryColor}, blue: ${brand.secondaryColor})`);

  // 3. Marketing Model Library — 10 profiles (5 male, 5 female)
  // All are SYNTHETIC (AI-generated avatars), not real people. Consent = GRANTED for synthetic use.
  const models = [
    // Male
    { modelId: "MM-0001", displayName: "Arif", gender: "MALE", ageRange: "25-30", appearanceDesc: "Professional Bangladeshi male, neat haircut, friendly demeanor", voiceProfile: "VP-0001", language: "bn", accent: "dhaka", wardrobe: '["formal-suit","smart-casual","panjabi"]' },
    { modelId: "MM-0002", displayName: "Sakib", gender: "MALE", ageRange: "28-35", appearanceDesc: "Mature Bangladeshi male, well-groomed beard, confident", voiceProfile: "VP-0002", language: "en", accent: "bangladeshi-english", wardrobe: '["blazer","shirt-trousers","formal"]' },
    { modelId: "MM-0003", displayName: "Tanvir", gender: "MALE", ageRange: "22-27", appearanceDesc: "Young Bangladeshi male, modern hairstyle, energetic", voiceProfile: "VP-0001", language: "banglish", accent: "dhaka", wardrobe: '["casual","smart-casual","t-shirt"]' },
    { modelId: "MM-0004", displayName: "Rahim", gender: "MALE", ageRange: "30-40", appearanceDesc: "Distinguished Bangladeshi male, professional appearance", voiceProfile: "VP-0002", language: "bn", accent: "standard-bengali", wardrobe: '["formal-suit","panjabi","blazer"]' },
    { modelId: "MM-0005", displayName: "Karim", gender: "MALE", ageRange: "25-32", appearanceDesc: "Approachable Bangladeshi male, clean-shaven, warm smile", voiceProfile: "VP-0001", language: "bn", accent: "dhaka", wardrobe: '["smart-casual","formal","casual"]' },
    // Female
    { modelId: "MM-0006", displayName: "Aisha", gender: "FEMALE", ageRange: "25-30", appearanceDesc: "Professional Bangladeshi female, elegant hijab, warm demeanor", voiceProfile: "VP-0003", language: "bn", accent: "dhaka", wardrobe: '["hijab-formal","modest-dress","smart-casual"]' },
    { modelId: "MM-0007", displayName: "Nadia", gender: "FEMALE", ageRange: "28-35", appearanceDesc: "Confident Bangladeshi female, modern professional attire", voiceProfile: "VP-0004", language: "en", accent: "bangladeshi-english", wardrobe: '["blazer","formal","smart-casual"]' },
    { modelId: "MM-0008", displayName: "Fatima", gender: "FEMALE", ageRange: "22-27", appearanceDesc: "Young Bangladeshi female, stylish hijab, friendly", voiceProfile: "VP-0003", language: "banglish", accent: "dhaka", wardrobe: '["hijab-casual","modest-smart","salwar-kameez"]' },
    { modelId: "MM-0009", displayName: "Sadia", gender: "FEMALE", ageRange: "30-40", appearanceDesc: "Distinguished Bangladeshi female, professional, graceful", voiceProfile: "VP-0004", language: "bn", accent: "standard-bengali", wardrobe: '["saree-formal","hijab-formal","blazer"]' },
    { modelId: "MM-0010", displayName: "Tania", gender: "FEMALE", ageRange: "25-32", appearanceDesc: "Approachable Bangladeshi female, modern, warm smile", voiceProfile: "VP-0003", language: "bn", accent: "dhaka", wardrobe: '["smart-casual","salwar-kameez","formal"]' },
  ];

  for (const m of models) {
    await db.marketingModel.upsert({
      where: { modelId: m.modelId },
      update: {},
      create: {
        ...m,
        wardrobe: m.wardrobe,
        brandUsageRights: true,
        consentStatus: "GRANTED",
        consentDate: new Date(),
        approvedPlatforms: '["facebook","instagram","youtube","tiktok","website"]',
        isSynthetic: true,
        status: "ACTIVE",
      },
    });
  }
  console.log(`  ✓ ${models.length} marketing models (5 male, 5 female, all synthetic with consent)`);

  // 4. Voice Profiles — 4 profiles
  const voices = [
    { voiceId: "VP-0001", displayName: "Arif Voice", language: "bn", accent: "dhaka", gender: "MALE", voiceStyle: "warm", providerVoiceId: "bn-male-warm-01" },
    { voiceId: "VP-0002", displayName: "Sakib Voice", language: "en", accent: "bangladeshi-english", gender: "MALE", voiceStyle: "professional", providerVoiceId: "en-bd-male-prof-01" },
    { voiceId: "VP-0003", displayName: "Aisha Voice", language: "bn", accent: "dhaka", gender: "FEMALE", voiceStyle: "warm", providerVoiceId: "bn-female-warm-01" },
    { voiceId: "VP-0004", displayName: "Nadia Voice", language: "en", accent: "bangladeshi-english", gender: "FEMALE", voiceStyle: "professional", providerVoiceId: "en-bd-female-prof-01" },
  ];

  for (const v of voices) {
    await db.voiceProfile.upsert({
      where: { voiceId: v.voiceId },
      update: {},
      create: {
        ...v,
        consentStatus: "GRANTED",
        consentDate: new Date(),
        usageRights: '{"marketing":"allowed","educational":"allowed","internal":"allowed"}',
        isSynthetic: true,
        status: "ACTIVE",
      },
    });
  }
  console.log(`  ✓ ${voices.length} voice profiles (synthetic, consent granted)`);

  // Summary
  console.log("\n=== Seed Summary ===");
  console.log(`  Storage pools: ${await db.storagePool.count()}`);
  console.log(`  Brand profiles: ${await db.brandProfile.count()}`);
  console.log(`  Marketing models: ${await db.marketingModel.count()}`);
  console.log(`  Voice profiles: ${await db.voiceProfile.count()}`);
  console.log("\n=== Seed Complete ===");
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
