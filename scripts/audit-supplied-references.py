#!/usr/bin/env python3
"""Read-only GitHub reference inventory. Never executes downloaded source.
Run with gh authentication; raw evidence goes to ignored _reference_repos/.
The JSON is an access/source inventory, NOT a claim of feature parity.
"""
import base64
import concurrent.futures
import hashlib
import json
from pathlib import Path
import re
import subprocess
from datetime import datetime, timezone

REPOSITORIES = '''melgarafael/DeskcommCRM
Django-CRM/Django-CRM
Odoo-mobile/crm
thu-ml/CRM
dennisivy/crash-course-CRM
oroinc/crm-application
trycompai/crm
frappe/crm
ChurchCRM/CRM
crmeb/CRMEB
idurar/idurar-erp-crm
oroinc/crm
fatfreecrm/fat_free_crm
engralaminn-collab/alo-education-uk-final
engralaminn-collab/ukvi-ai-markting_n8n
engralaminn-collab/Ai-Markting-crm
domovinatv/sms.domovina.ai
NdoleStudio/httpsms
NdoleStudio/httpsms-node
HM-RunningHub/ComfyUI_RH_APICall
BelledonneCommunications/linphone-iphone
0perationPrivacy/VoIP
YutaroHayakawa/ipftrace2
developerspace-samples/VoIP-Call-Sample
sibnerian/electron-promise-ipc'''.splitlines()

FOCUS = {
    'NdoleStudio/httpsms': r'(webhook.*\.go$|message.*(handler|response).*\.go$)',
    'NdoleStudio/httpsms-node': r'src/(models|message-service)\.ts$',
    'domovinatv/sms.domovina.ai': r'(README|webhook|send.*\.(ts|py)|routes.*\.py)',
    'HM-RunningHub/ComfyUI_RH_APICall': r'(execute|api|upload).*\.py$',
    'sibnerian/electron-promise-ipc': r'(main|renderer|index).*\.(ts|js)$',
    'thu-ml/CRM': r'(inference|train|pipeline).*\.py$',
}

# Explicit source selections reproduce the manual follow-up (no glob-only demo picks).
SOURCE_PATHS = {'melgarafael/DeskcommCRM': ['README.md', 'scripts/seed-e2e-kanban.ts', 'scripts/seed-e2e-nascimento-do-lead.ts', 'lib/types/leads.ts', 'ARCHITECTURE.md', 'components/kanban/KanbanBoard.tsx', 'components/kanban/KanbanCard.tsx'], 'Django-CRM/Django-CRM': ['backend/leads/views/lead_views.py', 'backend/leads/views/kanban_views.py', 'README.md', 'backend/leads/apps.py', 'backend/leads/urls.py', 'backend/leads/admin.py', 'docs/architecture/overview.md', 'backend/leads/models.py'], 'Odoo-mobile/crm': ['README.md', 'app/src/main/java/odoo/controls/IOnChangeCallback.java', 'app/src/main/java/odoo/controls/IOnDomainFilterCallbacks.java', 'app/src/main/java/com/odoo/addons/crm/CRMLeads.java', 'app/src/main/res/layout/crm_convert_to_opportunity.xml', 'app/src/main/java/com/odoo/addons/crm/CRMOpportunities.java'], 'thu-ml/CRM': ['README.md', 'train.py', 'inference.py', 'pipelines.py'], 'dennisivy/crash-course-CRM': ['README.md', 'crm/accounts/models.py', 'crm/accounts/views.py', 'crm/accounts/templates/accounts/dashboard.html'], 'oroinc/crm-application': ['README.md', 'LICENSE', 'composer.json'], 'trycompai/crm': ['README.md', 'apps/app/lib/contact-facts.ts', 'apps/app/components/crm/contact-name.ts', 'apps/api/src/contacts/contacts.module.ts', '.agents/skills/nestjs-best-practices/rules/arch-feature-modules.md', 'apps/api/src/contacts/contacts.service.ts', 'apps/app/components/crm/timeline/activity-composer.tsx'], 'frappe/crm': ['README.md', 'crm/demo/leads.py', 'crm/api/contact.py', 'crm/demo/call_logs.py', '.github/ISSUE_TEMPLATE/feature_request.md', 'frontend/src/components/Kanban/KanbanView.vue', 'crm/fcrm/doctype/crm_lead/crm_lead.json'], 'ChurchCRM/CRM': ['README.md', 'src/VolunteerOpportunityEditor.php', 'webpack/portal/volunteer-opportunities.ts', 'src/ChurchCRM/model/ChurchCRM/VolunteerOpportunity.php', '.agents/skills/churchcrm/git-workflow.md', '.agents/skills/churchcrm/marketing-visuals-pipeline.md'], 'crmeb/CRMEB': ['README.md', 'crmeb/app/api/middleware/CustomerMiddleware.php', 'template/uni-app/subpackage/diyComponents/customerService.vue', 'crmeb/public/static/js/pages-extension-customer_list-chat.dae77ce8.js', 'crmeb/vendor/phpoffice/phpexcel/Documentation/markdown/Overview/02-Architecture.md', 'template/admin/src/pages/order/invoice/index.vue', 'crmeb/app/services/order/StoreOrderInvoiceServices.php'], 'idurar/idurar-erp-crm': ['README.md', 'frontend/src/pages/Customer/config.js', 'features/zh_cn_免费开源ERP CRM软件.md', 'backend/src/models/appModels/Invoice.js', 'frontend/src/modules/InvoiceModule/Forms/InvoiceForm.jsx'], 'oroinc/crm': ['README.md', 'src/Oro/Bridge/CallCRM/OroCallCRMBridgeBundle.php', 'src/Oro/Bundle/ContactBundle/OroContactBundle.php', 'src/Oro/Bundle/ContactUsBundle/OroContactUsBundle.php', '.github/ISSUE_TEMPLATE/2_feature_request.md', 'src/Oro/Bundle/ContactBundle/Entity/Contact.php', 'LICENSE'], 'fatfreecrm/fat_free_crm': ['README.md', 'app/helpers/leads_helper.rb', 'lib/fat_free_crm/callback.rb', 'app/helpers/contacts_helper.rb', 'app/models/entities/opportunity.rb', 'app/views/opportunities/_index_long.html.haml', 'MIT-LICENSE'], 'domovinatv/sms.domovina.ai': ['README.md', 'webhook/index.ts', 'httpsms/README.md', 'webhook/src/app.ts'], 'NdoleStudio/httpsms': ['README.md', 'api/pkg/entities/webhook.go', 'api/pkg/handlers/message_handler.go', 'api/pkg/handlers/webhook_handler.go', 'api/pkg/listeners/webhook_listener.go', 'api/pkg/services/webhook_service.go', 'api/pkg/events/message_phone_delivered_event.go', 'api/pkg/events/message_phone_received_event.go', 'api/pkg/events/message_phone_sending_event.go', 'api/pkg/events/message_phone_sent_event.go', 'api/pkg/events/message_send_expired_check_event.go', 'api/pkg/events/message_send_expired_event.go', 'api/pkg/events/message_send_failed_event.go', 'api/pkg/events/message_send_retry_event.go', 'api/pkg/events/message_send_schedule_deleted_event.go'], 'NdoleStudio/httpsms-node': ['readme.md', 'src/models.ts', 'src/message-service.ts'], 'HM-RunningHub/ComfyUI_RH_APICall': ['README.md', 'RH_ExecuteNode.py', 'RH_AudioUploader.py', 'RH_VideoUploader.py', 'RH_ImageUploaderNode.py'], 'BelledonneCommunications/linphone-iphone': ['README.md', 'Linphone/Contacts/ContactsManager.swift', 'Linphone/Utils/EditContactController.swift', 'Linphone/UI/Call/CallView.swift'], '0perationPrivacy/VoIP': ['README.md', 'app/routes/call.route.js', 'app/model/contact.model.js', 'app/routes/contact.route.js', '.github/ISSUE_TEMPLATE/feature-request.md', 'app/controller/call.controller.js'], 'YutaroHayakawa/ipftrace2': ['README.md', 'src/output_json.c', 'docs/internals.md', 'LICENSE'], 'developerspace-samples/VoIP-Call-Sample': ['README.md', 'uikit/src/main/java/com/cometchat/pro/uikit/ui_resources/utils/CallUtils.java', 'uikit/src/main/java/com/cometchat/pro/uikit/ui_components/calls/call_list/AllCall.java', 'uikit/src/main/java/com/cometchat/pro/uikit/ui_components/calls/call_list/MissedCall.java', 'app/src/main/java/com/developerspace/voipcalling/utils/CallConnectionService.kt'], 'sibnerian/electron-promise-ipc': ['README.md', 'src/index.ts', 'src/renderer.ts', 'src/mainProcess.ts']}

def api(path):
    p = subprocess.run(['gh', 'api', path], capture_output=True, text=True, timeout=90)
    if p.returncode:
        raise RuntimeError(p.stderr.strip()[:350])
    return json.loads(p.stdout)

def review(repo):
    result = {'repository': repo, 'url': f'https://github.com/{repo}.git'}
    try:
        meta = api(f'repos/{repo}')
        result.update(access='accessible', description=meta.get('description'), license=(meta.get('license') or {}).get('spdx_id'), defaultBranch=meta['default_branch'])
        sha = api(f'repos/{repo}/commits/{meta["default_branch"]}')['sha']
        result['commit'] = sha
        tree = api(f'repos/{repo}/git/trees/{sha}?recursive=1')
        result['treeTruncated'] = tree.get('truncated', False)
        files = [x['path'] for x in tree['tree'] if x['type'] == 'blob']
        result['fileCount'] = len(files)
        root = Path('_reference_repos') / repo.replace('/', '__')
        root.mkdir(parents=True, exist_ok=True)
        (root/'tree.json').write_text(json.dumps(tree, indent=2))
        readmes = sorted([p for p in files if re.search(r'(^|/)readme(\.md|\.rst|\.txt)?$', p, re.I)], key=lambda p: (p.count('/'), len(p)))[:1]
        pattern = FOCUS.get(repo, r'(lead|contact|opportunit|campaign|kanban|call|pipeline|customer).*\.(vue|tsx|ts|py|php|rb|swift|java|js)$')
        source = sorted([p for p in files if re.search(pattern, p, re.I) and not re.search(r'(vendor|node_modules|\.min\.|migration|locale|test|spec|lock)', p, re.I)], key=lambda p: (p.count('/'), len(p)))[:3]
        docs = sorted([p for p in files if re.search(r'(feature|architecture|workflow|webhook).*\.(md|rst)$', p, re.I)], key=len)[:1]
        result['filesRead'] = []
        for path in dict.fromkeys(SOURCE_PATHS.get(repo, readmes + source + docs)):
            try:
                item = api(f'repos/{repo}/contents/{path}?ref={sha}')
                raw = base64.b64decode(item['content'])
                dest = root/path
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(raw)
                text = raw.decode('utf-8', errors='replace')
                result['filesRead'].append({'path': path, 'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest(), 'url': f'https://github.com/{repo}/blob/{sha}/{path}', 'headings': re.findall(r'^#{1,4}\s+(.+)$', text, re.M)[:24]})
            except Exception as e:
                result['filesRead'].append({'path': path, 'error': str(e)})
    except Exception as e:
        result.update(access='blocked', error=str(e))
    print(repo, result['access'], flush=True)
    return result

if __name__ == '__main__':
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        results = list(pool.map(review, REPOSITORIES))
    path = Path('AUDIT/supplied-reference-source-evidence-2026-10-10.json')
    path.write_text(json.dumps({'checkedAt': datetime.now(timezone.utc).isoformat(), 'method': 'Pinned GitHub metadata, recursive tree, README and selected implementation files. Not exhaustive code review; no upstream source executed or imported.', 'results': results}, indent=2)+'\n')
