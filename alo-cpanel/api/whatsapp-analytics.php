<?php
declare(strict_types=1);
/**
 * API: GET /api/whatsapp-analytics.php — returns followup, SLA, document stats
 */
$GLOBALS['__skip_csrf'] = true;
require_once __DIR__ . '/../app/bootstrap.php';
header('Content-Type: application/json; charset=utf-8');
if (!is_logged_in()) { http_response_code(401); echo json_encode(['success'=>false]); exit; }
$pdo = db();
$data = [];
try { $data['total_conversations'] = (int)$pdo->query('SELECT COUNT(*) FROM whatsapp_conversations')->fetchColumn(); } catch (\Throwable $e) {$data['total_conversations']=0;}
try { $data['open_conversations'] = (int)$pdo->query('SELECT COUNT(*) FROM whatsapp_conversations WHERE status="open"')->fetchColumn(); } catch (\Throwable $e) {$data['open_conversations']=0;}
try { $data['pending_followups'] = (int)$pdo->query('SELECT COUNT(*) FROM whatsapp_followup_schedule WHERE status="pending"')->fetchColumn(); } catch (\Throwable $e) {$data['pending_followups']=0;}
try { $data['sla_breaches_24h'] = (int)$pdo->query('SELECT COUNT(*) FROM whatsapp_sla_events WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)')->fetchColumn(); } catch (\Throwable $e) {$data['sla_breaches_24h']=0;}
try { $data['global_alarms_active'] = (int)$pdo->query('SELECT COUNT(*) FROM dashboard_alarms WHERE alarm_status="active"')->fetchColumn(); } catch (\Throwable $e) {$data['global_alarms_active']=0;}
try { $data['documents_awaiting_review'] = (int)$pdo->query('SELECT COUNT(*) FROM student_documents WHERE status="needs_review"')->fetchColumn(); } catch (\Throwable $e) {$data['documents_awaiting_review']=0;}
try { $data['numbers_pool'] = (int)$pdo->query('SELECT COUNT(*) FROM alo_whatsapp_numbers')->fetchColumn(); } catch (\Throwable $e) {$data['numbers_pool']=0;}
echo json_encode(['success'=>true,'data'=>$data]);
