"use client";

import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { ManagedContentManager } from "@/components/admin/ManagedContentManager";

type CmsType = string;

interface CmsItem {
  id: string;
  [key: string]: any;
}

const WEBSITE_TYPES = [
  { key: "hero-slides", label: "Hero Slides", icon: "🎯", desc: "Homepage hero carousel" },
  { key: "home-services", label: "Home Services", icon: "🛎️", desc: "Services section" },
  { key: "success-stories", label: "Success Stories", icon: "🌟", desc: "Student testimonials" },
  { key: "team-members", label: "Team Members", icon: "👥", desc: "Our team" },
  { key: "faqs", label: "Homepage FAQs", icon: "❓", desc: "FAQ section" },
  { key: "home-sections", label: "Home Sections", icon: "📄", desc: "Editable sections" },
  { key: "english-tests", label: "English Tests", icon: "📝", desc: "IELTS, PTE etc" },
  { key: "countries", label: "Countries", icon: "🌍", desc: "Destinations" },
  { key: "services", label: "Services (Old)", icon: "⚙️", desc: "Legacy services" },
];

const COUNTRY_SUB_TYPES = [
  { key: "country-quick-facts", label: "Quick Facts" },
  { key: "country-cities", label: "Cities" },
  { key: "country-reasons", label: "Why Study Reasons" },
  { key: "country-entry-reqs", label: "Entry Requirements" },
  { key: "country-english-tests", label: "English Tests (Country)" },
  { key: "country-visa-steps", label: "Visa Steps" },
  { key: "country-work-rights", label: "Work Rights" },
  { key: "country-faqs", label: "Country FAQs" },
  { key: "country-sources", label: "Sources" },
];

export function SuperAdminWebsiteCmsHub() {
  // Top-level view: website content (model-backed types) vs the
  // site-wide & CRM managed-content Virtual Editor (§15).
  const [view, setView] = useState<"website" | "managed">("website");
  const [activeType, setActiveType] = useState<CmsType>("hero-slides");
  const [items, setItems] = useState<CmsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<CmsItem | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [showForm, setShowForm] = useState(false);
  const [selectedCountryId, setSelectedCountryId] = useState("");
  const [countries, setCountries] = useState<any[]>([]);

  // ── Virtual Editor revision state ──────────────────────────
  const [historyFor, setHistoryFor] = useState<CmsItem | null>(null);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [preview, setPreview] = useState<any | null>(null);
  const [revisionBusy, setRevisionBusy] = useState(false);

  // Fetch countries for dropdown
  useEffect(() => {
    fetch("/api/admin/website/cms?type=countries&limit=100")
      .then(r => r.json())
      .then(j => { if (j.success) setCountries(j.data); })
      .catch(()=>{});
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/website/cms?type=${activeType}&limit=200`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (selectedCountryId && activeType.startsWith("country-")) url += `&countryId=${selectedCountryId}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setItems(json.data || []);
      } else {
        toast({ title: "Error", description: json.error, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Fetch failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeType, selectedCountryId]);

  const handleEdit = (item: CmsItem) => {
    setEditing(item);
    setFormData(item);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditing(null);
    setFormData(activeType.startsWith("country-") && selectedCountryId ? { countryId: selectedCountryId } : {});
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      const method = editing ? "PUT" : "POST";
      let url = `/api/admin/website/cms?type=${activeType}`;
      if (editing) url += `&id=${editing.id}`;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: editing ? "Updated" : "Created", description: `${activeType} ${editing ? "updated" : "created"} successfully` });
        setShowForm(false);
        fetchItems();
      } else {
        toast({ title: "Error", description: json.error, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item? A revision snapshot is kept, so it can be restored from History.")) return;
    try {
      const res = await fetch(`/api/admin/website/cms?type=${activeType}&id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast({ title: "Deleted", description: "Item deleted (snapshot retained in revision history)" });
        fetchItems();
      } else {
        toast({ title: "Error", description: json.error, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    }
  };

  // ── Virtual Editor: revision history / draft / publish / rollback ──
  const handleHistory = async (item: CmsItem) => {
    setHistoryFor(item);
    setPreview(null);
    try {
      const res = await fetch(`/api/admin/website/cms?action=revisions&type=${activeType}&id=${item.id}`);
      const json = await res.json();
      if (json.success) setRevisions(json.revisions || []);
      else toast({ title: "Error", description: json.error, variant: "destructive" });
    } catch (e: any) {
      toast({ title: "History failed", description: e.message, variant: "destructive" });
    }
  };

  const handlePreviewRevision = async (revisionId: string) => {
    try {
      const res = await fetch(`/api/admin/website/cms?action=preview&revisionId=${revisionId}`);
      const json = await res.json();
      if (json.success) setPreview(json.preview);
      else toast({ title: "Error", description: json.error, variant: "destructive" });
    } catch (e: any) {
      toast({ title: "Preview failed", description: e.message, variant: "destructive" });
    }
  };

  const handleRollback = async (revisionId: string) => {
    if (!confirm("Roll back to this revision? The current state is itself snapshotted first, so the rollback is reversible.")) return;
    setRevisionBusy(true);
    try {
      const res = await fetch(`/api/admin/website/cms?type=${activeType}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rollback", revisionId }),
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: "Rolled back", description: "Live content restored from the selected revision" });
        setHistoryFor(null);
        fetchItems();
      } else {
        toast({ title: "Rollback failed", description: json.error, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Rollback failed", description: e.message, variant: "destructive" });
    } finally {
      setRevisionBusy(false);
    }
  };

  const handleSaveDraft = async () => {
    setRevisionBusy(true);
    try {
      const res = await fetch(`/api/admin/website/cms?type=${activeType}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-draft",
          entityId: editing?.id || "",
          data: formData,
          label: (formData.title || formData.name || formData.headline || formData.question || "draft").toString().slice(0, 80),
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: "Draft saved", description: "Nothing is live yet — publish it from the item's History when ready" });
        setShowForm(false);
      } else {
        toast({ title: "Error", description: json.error, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Draft failed", description: e.message, variant: "destructive" });
    } finally {
      setRevisionBusy(false);
    }
  };

  const handlePublishDraft = async (revisionId: string) => {
    if (!confirm("Publish this draft to the live website? A before-image snapshot is captured first.")) return;
    setRevisionBusy(true);
    try {
      const res = await fetch(`/api/admin/website/cms?type=${activeType}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish-draft", revisionId }),
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: "Published", description: "Draft is now live (publish timestamp + user recorded)" });
        setHistoryFor(null);
        fetchItems();
      } else {
        toast({ title: "Publish failed", description: json.error, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Publish failed", description: e.message, variant: "destructive" });
    } finally {
      setRevisionBusy(false);
    }
  };

  const renderFormFields = () => {
    switch (activeType) {
      case "hero-slides":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-xs font-medium">Headline</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.headline||""} onChange={e=>setFormData({...formData, headline: e.target.value})} /></div>
            <div><label className="text-xs font-medium">Country Code</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.countryCode||""} onChange={e=>setFormData({...formData, countryCode: e.target.value})} placeholder="UK, USA..." /></div>
            <div className="md:col-span-2"><label className="text-xs font-medium">Subtitle</label><textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} value={formData.subtitle||""} onChange={e=>setFormData({...formData, subtitle: e.target.value})} /></div>
            <div><label className="text-xs font-medium">Image URL</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.imageUrl||""} onChange={e=>setFormData({...formData, imageUrl: e.target.value})} /></div>
            <div><label className="text-xs font-medium">Accent Color</label><input className="w-full border rounded-lg px-3 py-2 text-sm" type="color" value={formData.accentColor||"#0057B8"} onChange={e=>setFormData({...formData, accentColor: e.target.value})} /></div>
            <div><label className="text-xs font-medium">Popular City</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.popularCity||""} onChange={e=>setFormData({...formData, popularCity: e.target.value})} /></div>
            <div><label className="text-xs font-medium">Popular Intake</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.popularIntake||""} onChange={e=>setFormData({...formData, popularIntake: e.target.value})} /></div>
            <div><label className="text-xs font-medium">CTA Primary Label</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.ctaPrimaryLabel||""} onChange={e=>setFormData({...formData, ctaPrimaryLabel: e.target.value})} /></div>
            <div><label className="text-xs font-medium">CTA Primary URL</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.ctaPrimaryUrl||""} onChange={e=>setFormData({...formData, ctaPrimaryUrl: e.target.value})} /></div>
            <div><label className="text-xs font-medium">Sort Order</label><input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.sortOrder||0} onChange={e=>setFormData({...formData, sortOrder: parseInt(e.target.value)||0})} /></div>
            <div><label className="text-xs font-medium">Status</label><select className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.status||"active"} onChange={e=>setFormData({...formData, status: e.target.value})}><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option></select></div>
          </div>
        );
      case "home-services":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-xs font-medium">Title</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.title||""} onChange={e=>setFormData({...formData, title: e.target.value})} /></div>
            <div><label className="text-xs font-medium">Slug</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.slug||""} onChange={e=>setFormData({...formData, slug: e.target.value})} /></div>
            <div><label className="text-xs font-medium">Icon (emoji)</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.icon||""} onChange={e=>setFormData({...formData, icon: e.target.value})} /></div>
            <div><label className="text-xs font-medium">Sort Order</label><input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.sortOrder||0} onChange={e=>setFormData({...formData, sortOrder: parseInt(e.target.value)||0})} /></div>
            <div className="md:col-span-2"><label className="text-xs font-medium">Description</label><textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} value={formData.description||""} onChange={e=>setFormData({...formData, description: e.target.value})} /></div>
            <div><label className="text-xs font-medium">CTA Label</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.ctaLabel||""} onChange={e=>setFormData({...formData, ctaLabel: e.target.value})} /></div>
            <div><label className="text-xs font-medium">CTA URL</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.ctaUrl||""} onChange={e=>setFormData({...formData, ctaUrl: e.target.value})} /></div>
          </div>
        );
      case "success-stories":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-xs font-medium">Student Name</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.studentName||""} onChange={e=>setFormData({...formData, studentName: e.target.value})} /></div>
            <div><label className="text-xs font-medium">Home District</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.homeDistrict||""} onChange={e=>setFormData({...formData, homeDistrict: e.target.value})} /></div>
            <div><label className="text-xs font-medium">University</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.university||""} onChange={e=>setFormData({...formData, university: e.target.value})} /></div>
            <div><label className="text-xs font-medium">Course</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.course||""} onChange={e=>setFormData({...formData, course: e.target.value})} /></div>
            <div className="md:col-span-2"><label className="text-xs font-medium">Testimonial</label><textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} value={formData.testimonial||""} onChange={e=>setFormData({...formData, testimonial: e.target.value})} /></div>
            <div><label className="text-xs font-medium">Outcome</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.outcome||""} onChange={e=>setFormData({...formData, outcome: e.target.value})} /></div>
            <div><label className="text-xs font-medium">Photo URL</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.photo||""} onChange={e=>setFormData({...formData, photo: e.target.value})} /></div>
          </div>
        );
      case "team-members":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-xs font-medium">Name</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.name||""} onChange={e=>setFormData({...formData, name: e.target.value})} /></div>
            <div><label className="text-xs font-medium">Role</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.role||""} onChange={e=>setFormData({...formData, role: e.target.value})} /></div>
            <div><label className="text-xs font-medium">Specialty</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.specialty||""} onChange={e=>setFormData({...formData, specialty: e.target.value})} /></div>
            <div><label className="text-xs font-medium">Photo URL</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.photo||""} onChange={e=>setFormData({...formData, photo: e.target.value})} /></div>
            <div className="md:col-span-2"><label className="text-xs font-medium">Bio</label><textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} value={formData.bio||""} onChange={e=>setFormData({...formData, bio: e.target.value})} /></div>
          </div>
        );
      case "faqs":
        return (
          <div className="space-y-4">
            <div><label className="text-xs font-medium">Question</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.question||""} onChange={e=>setFormData({...formData, question: e.target.value})} /></div>
            <div><label className="text-xs font-medium">Answer</label><textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={4} value={formData.answer||""} onChange={e=>setFormData({...formData, answer: e.target.value})} /></div>
            <div><label className="text-xs font-medium">Sort Order</label><input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.sortOrder||0} onChange={e=>setFormData({...formData, sortOrder: parseInt(e.target.value)||0})} /></div>
          </div>
        );
      case "home-sections":
        return (
          <div className="space-y-4">
            <div><label className="text-xs font-medium">Section Key (unique)</label><input className="w-full border rounded-lg px-3 py-2 text-sm font-mono" value={formData.sectionKey||""} onChange={e=>setFormData({...formData, sectionKey: e.target.value})} placeholder="hero, about, why-choose, etc" /></div>
            <div><label className="text-xs font-medium">Title</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.title||""} onChange={e=>setFormData({...formData, title: e.target.value})} /></div>
            <div><label className="text-xs font-medium">Subtitle</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.subtitle||""} onChange={e=>setFormData({...formData, subtitle: e.target.value})} /></div>
            <div><label className="text-xs font-medium">Content (HTML/Markdown supported)</label><textarea className="w-full border rounded-lg px-3 py-2 text-sm font-mono" rows={6} value={formData.content||""} onChange={e=>setFormData({...formData, content: e.target.value})} /></div>
          </div>
        );
      case "english-tests":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-xs font-medium">Name</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.name||""} onChange={e=>setFormData({...formData, name: e.target.value})} /></div>
            <div><label className="text-xs font-medium">Slug</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.slug||""} onChange={e=>setFormData({...formData, slug: e.target.value})} /></div>
            <div className="md:col-span-2"><label className="text-xs font-medium">Short Description</label><textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} value={formData.shortDescription||""} onChange={e=>setFormData({...formData, shortDescription: e.target.value})} /></div>
            <div><label className="text-xs font-medium">Best For</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.bestFor||""} onChange={e=>setFormData({...formData, bestFor: e.target.value})} /></div>
            <div><label className="text-xs font-medium">Accepted Destinations</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.acceptedDest||""} onChange={e=>setFormData({...formData, acceptedDest: e.target.value})} /></div>
            <div><label className="text-xs font-medium">Result Time</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.resultTime||""} onChange={e=>setFormData({...formData, resultTime: e.target.value})} /></div>
            <div><label className="text-xs font-medium">Score Range</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.scoreRange||""} onChange={e=>setFormData({...formData, scoreRange: e.target.value})} /></div>
          </div>
        );
      case "countries":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-xs font-medium">Name</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.name||""} onChange={e=>setFormData({...formData, name: e.target.value})} /></div>
            <div><label className="text-xs font-medium">Slug</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.slug||""} onChange={e=>setFormData({...formData, slug: e.target.value})} /></div>
            <div><label className="text-xs font-medium">Code</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.code||formData.countryCode||""} onChange={e=>setFormData({...formData, code: e.target.value, countryCode: e.target.value})} /></div>
            <div><label className="text-xs font-medium">Flag Emoji</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.flag||""} onChange={e=>setFormData({...formData, flag: e.target.value})} /></div>
            <div><label className="text-xs font-medium">Capital</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.capital||""} onChange={e=>setFormData({...formData, capital: e.target.value})} /></div>
            <div><label className="text-xs font-medium">Currency</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.currency||""} onChange={e=>setFormData({...formData, currency: e.target.value})} /></div>
            <div className="md:col-span-2"><label className="text-xs font-medium">Hero Title</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.heroTitle||""} onChange={e=>setFormData({...formData, heroTitle: e.target.value})} /></div>
            <div className="md:col-span-2"><label className="text-xs font-medium">Hero Subtitle</label><textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} value={formData.heroSubtitle||""} onChange={e=>setFormData({...formData, heroSubtitle: e.target.value})} /></div>
            <div className="md:col-span-2"><label className="text-xs font-medium">Overview</label><textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={4} value={formData.overview||formData.description||""} onChange={e=>setFormData({...formData, overview: e.target.value, description: e.target.value})} /></div>
            <div><label className="text-xs font-medium">Tuition Range</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.tuitionRange||""} onChange={e=>setFormData({...formData, tuitionRange: e.target.value})} /></div>
            <div><label className="text-xs font-medium">Living Cost</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.livingCost||""} onChange={e=>setFormData({...formData, livingCost: e.target.value})} /></div>
            <div><label className="text-xs font-medium">Visa Type</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.visaType||""} onChange={e=>setFormData({...formData, visaType: e.target.value})} /></div>
            <div><label className="text-xs font-medium">Sort Order</label><input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.sortOrder||0} onChange={e=>setFormData({...formData, sortOrder: parseInt(e.target.value)||0})} /></div>
          </div>
        );
      default:
        return (
          <div className="space-y-3">
            <p className="text-xs text-[var(--alo-text-muted)]">Editing {activeType} — generic JSON editor for advanced fields</p>
            <textarea className="w-full border rounded-lg px-3 py-2 text-xs font-mono" rows={12} value={JSON.stringify(formData, null, 2)} onChange={e=>{ try{ setFormData(JSON.parse(e.target.value)); }catch{}}} />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Virtual Editor view switch (§15: website content vs site-wide & CRM content) */}
      <div className="flex gap-2 border-b border-[var(--alo-border)] pb-3">
        <button onClick={() => setView("website")} className={`px-3 py-2 rounded-xl text-sm font-medium transition ${view === "website" ? "bg-[var(--alo-brand)] text-white" : "bg-white border border-[var(--alo-border)] hover:bg-[var(--alo-page)]"}`}>Website Content</button>
        <button onClick={() => setView("managed")} className={`px-3 py-2 rounded-xl text-sm font-medium transition ${view === "managed" ? "bg-[var(--alo-brand)] text-white" : "bg-white border border-[var(--alo-border)] hover:bg-[var(--alo-page)]"}`}>Site-Wide &amp; CRM (Nav / Footer / SEO / CRM)</button>
      </div>
      {view === "managed" && <ManagedContentManager />}
      {view === "website" && (
      <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--alo-text)]">Super Admin — Website CMS Hub</h2>
          <p className="text-sm text-[var(--alo-body)] mt-1">Edit website content directly. Every change is audit logged and permission-checked.</p>
        </div>
        <div className="flex gap-2">
          <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&fetchItems()} className="border rounded-lg px-3 py-2 text-sm w-48" />
          <button onClick={fetchItems} className="px-4 py-2 bg-[var(--alo-surface-muted)] hover:bg-slate-200 rounded-lg text-sm font-medium">🔍 Search</button>
          <button onClick={handleCreate} className="px-4 py-2 bg-[var(--alo-brand)] hover:bg-[var(--alo-brand-hover)] text-white rounded-lg text-sm font-semibold">+ New</button>
        </div>
      </div>

      {/* Type tabs */}
      <div className="flex flex-wrap gap-2">
        {WEBSITE_TYPES.map(t => (
          <button key={t.key} onClick={()=>setActiveType(t.key)} className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${activeType===t.key ? "bg-[var(--alo-brand)] text-white border-[var(--alo-brand)] shadow" : "bg-white hover:bg-[var(--alo-page)] border-[var(--alo-border)] text-[var(--alo-body)]"}`}>
            <span className="mr-1">{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Country sub-types */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-amber-800">Country Details:</span>
          {COUNTRY_SUB_TYPES.map(t=>(
            <button key={t.key} onClick={()=>setActiveType(t.key)} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border ${activeType===t.key ? "bg-amber-600 text-white border-amber-600" : "bg-white border-amber-200 text-amber-800 hover:bg-amber-100"}`}>{t.label}</button>
          ))}
          <select value={selectedCountryId} onChange={e=>setSelectedCountryId(e.target.value)} className="ml-2 border border-amber-300 rounded-lg px-2 py-1.5 text-xs bg-white">
            <option value="">All Countries / Select for sub-data</option>
            {countries.map(c=><option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Items table */}
      <div className="bg-white rounded-xl border border-[var(--alo-border)] shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-sm">{activeType} — {items.length} items {loading && "(loading...)"}</h3>
          <span className="text-xs text-[var(--alo-text-muted)]">Live data, audit logged</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--alo-page)] text-xs text-[var(--alo-text-muted)]">
              <tr>
                <th className="text-left px-4 py-2">ID / Title</th>
                <th className="text-left px-4 py-2">Key Info</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-right px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item=>(
                <tr key={item.id} className="border-t hover:bg-[var(--alo-page)]">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-[var(--alo-text)] truncate max-w-[220px]">{item.title || item.name || item.headline || item.question || item.studentName || item.sectionKey || item.slug || item.id.slice(0,8)}</div>
                    <div className="text-xs text-[var(--alo-text-muted)] font-mono">{item.id.slice(0,12)}...</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="text-xs text-[var(--alo-body)] truncate max-w-[320px]">{item.subtitle || item.description || item.testimonial || item.answer || item.overview || item.heroTitle || item.countryId || item.factValue || item.cityName || item.heading || ""}</div>
                  </td>
                  <td className="px-4 py-2.5"><span className={`text-xs px-2 py-1 rounded-full ${item.status==="active"||item.status==="published"||item.status==="verified" ? "bg-green-100 text-green-700" : "bg-[var(--alo-surface-muted)] text-[var(--alo-body)]"}`}>{item.status||"—"}</span></td>
                  <td className="px-4 py-2.5 text-right space-x-1">
                    <button onClick={()=>handleEdit(item)} className="px-2.5 py-1 bg-[var(--alo-brand-pale)] hover:bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] rounded-lg text-xs font-medium">Edit</button>
                    <button onClick={()=>handleHistory(item)} className="px-2.5 py-1 bg-[var(--alo-page)] hover:bg-[var(--alo-surface-muted)] text-[var(--alo-body)] rounded-lg text-xs font-medium">🕘 History</button>
                    <button onClick={()=>handleDelete(item.id)} className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-medium">Delete</button>
                  </td>
                </tr>
              ))}
              {items.length===0 && !loading && <tr><td colSpan={4} className="px-4 py-12 text-center text-[var(--alo-text-muted)] text-sm">No items found. Create first {activeType}.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="font-bold text-[var(--alo-text)]">{editing ? "Edit" : "Create"} {activeType}</h3>
              <button onClick={()=>setShowForm(false)} className="text-[var(--alo-text-muted)] hover:text-[var(--alo-body)]">✕</button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              {renderFormFields()}
            </div>
            <div className="p-4 border-t bg-[var(--alo-page)] flex justify-end gap-2">
              <button onClick={()=>setShowForm(false)} className="px-4 py-2 bg-white border rounded-xl text-sm">Cancel</button>
              <button onClick={handleSaveDraft} disabled={revisionBusy} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold">Save as Draft</button>
              <button onClick={handleSave} className="px-5 py-2 bg-[var(--alo-brand)] hover:bg-[var(--alo-brand-hover)] text-white rounded-xl text-sm font-semibold">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Revision history drawer (Virtual Editor) */}
      {historyFor && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[var(--alo-text)]">Revision History — {activeType}</h3>
                <p className="text-xs text-[var(--alo-text-muted)] mt-0.5 font-mono">{historyFor.id.slice(0, 14)}… · every edit keeps a before-image snapshot; rollbacks are reversible</p>
              </div>
              <button onClick={()=>setHistoryFor(null)} className="text-[var(--alo-text-muted)] hover:text-[var(--alo-body)]">✕</button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-2">
              {revisions.length === 0 && (
                <p className="text-sm text-[var(--alo-text-muted)] text-center py-8">No revisions yet — edit this item to create version history.</p>
              )}
              {revisions.map((rev: any) => (
                <div key={rev.id} className="border rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${rev.kind === "DRAFT" ? "bg-amber-100 text-amber-700" : rev.kind === "PUBLISHED" ? "bg-green-100 text-green-700" : rev.kind === "ROLLBACK" ? "bg-purple-100 text-purple-700" : "bg-[var(--alo-surface-muted)] text-[var(--alo-body)]"}`}>{rev.kind}</span>
                      <span className="text-sm font-medium text-[var(--alo-text)] truncate">{rev.label || "—"}</span>
                    </div>
                    <div className="text-xs text-[var(--alo-text-muted)] mt-1">
                      {new Date(rev.createdAt).toLocaleString()} · by {rev.createdBy?.slice(0, 18)}
                      {rev.publishedAt ? ` · published ${new Date(rev.publishedAt).toLocaleString()}` : ""}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={()=>handlePreviewRevision(rev.id)} className="px-3 py-1.5 bg-[var(--alo-page)] hover:bg-[var(--alo-surface-muted)] border rounded-lg text-xs font-medium">Preview</button>
                    {rev.kind === "DRAFT" && (
                      <button onClick={()=>handlePublishDraft(rev.id)} disabled={revisionBusy} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold">Publish</button>
                    )}
                    <button onClick={()=>handleRollback(rev.id)} disabled={revisionBusy} className="px-3 py-1.5 bg-[var(--alo-brand-pale)] hover:bg-[var(--alo-brand-pale)] disabled:opacity-50 text-[var(--alo-brand)] rounded-lg text-xs font-semibold">Rollback here</button>
                  </div>
                </div>
              ))}
            </div>
            {preview && (
              <div className="border-t bg-[var(--alo-page)] p-4">
                <div className="text-xs font-semibold text-[var(--alo-body)] mb-2">Preview — {preview.kind} revision (nothing is changed until you publish/rollback)</div>
                <pre className="text-[11px] bg-white border rounded-lg p-3 max-h-56 overflow-auto whitespace-pre-wrap break-words">{JSON.stringify(preview.snapshot, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
