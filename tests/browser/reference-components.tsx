import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import CampaignCreativeComposer from '@/components/marketing/CampaignCreativeComposer';
import SEOBlogManagerView from '@/components/marketing/hub/SEOBlogManagerView';
import DiagramStudio from '@/components/diagrams/DiagramStudio';
import MarketingKitPanel from '@/components/marketing/MarketingKitPanel';
import { DEFAULT_MARKETING_KITS } from '@/lib/marketing-kit';
import CrmLeadsPage from '@/components/crm/pages/CrmLeadsPage';
import KanbanPipeline from '@/components/crm/KanbanPipeline';
import { MarketingFunnelDiagram, EligibilityFlowDiagram } from '@/components/diagrams/alo-diagrams';
function Harness() {
 const [items, setItems] = useState([{id:'app1',title:'Synthetic application — not a real student',stage:'APPLICATION_DRAFT'}]);
 return <main className="mx-auto max-w-6xl p-4"><h1 className="text-2xl font-bold">ALO component verification harness</h1><p>Synthetic fixtures; not the production application or a provider test.</p>
 <CampaignCreativeComposer kit={DEFAULT_MARKETING_KITS[0]} />
 <section className="my-8"><KanbanPipeline items={items} onStageChange={async(id,stage)=>{if(stage==='SUCCESS')throw new Error('Synthetic forbidden transition');setItems(items=>items.map(item=>item.id===id?{...item,stage}:item));}} /></section>
 <MarketingFunnelDiagram stages={[{label:'Enquiries',value:10},{label:'Consultations',value:25},{label:'Enrolled',value:1}]}/><EligibilityFlowDiagram/><EligibilityFlowDiagram/>
 </main>
}
createRoot(document.getElementById('root')!).render(location.search.includes('seo') ? <SEOBlogManagerView/> : location.search.includes('leads') ? <CrmLeadsPage/> : location.search.includes('modules') ? <main><DiagramStudio/><section aria-label="Marketing library"><MarketingKitPanel/></section></main> : <Harness/>);
