-- ALO Education — Indexes
-- Generated: 2026-09-15 | Source: database/schema.sql | Engine: InnoDB utf8mb4_unicode_ci
-- Verification: SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE();

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
    UNIQUE INDEX `DeploymentSequence_name_key`(`name`),
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    INDEX `MarketingComment_platform_status_idx`(`platform`, `status`),
    INDEX `MarketingComment_leadId_idx`(`leadId`),
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    UNIQUE INDEX `Student_studentId_key`(`studentId`),
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    UNIQUE INDEX `TestResult_sessionId_key`(`sessionId`),
    PRIMARY KEY (`id`)
    UNIQUE INDEX `AiExamFeedback_sessionId_key`(`sessionId`),
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    UNIQUE INDEX `AiInterviewResult_sessionId_key`(`sessionId`),
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    INDEX `VisaCase_studentId_idx`(`studentId`),
    INDEX `VisaCase_visaOfficerId_idx`(`visaOfficerId`),
    INDEX `VisaCase_counselorId_idx`(`counselorId`),
    INDEX `VisaCase_currentStage_idx`(`currentStage`),
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    UNIQUE INDEX `VisaMockResult_interviewId_key`(`interviewId`),
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    UNIQUE INDEX `VisaRiskAssessment_caseId_key`(`caseId`),
    PRIMARY KEY (`id`)
    UNIQUE INDEX `VisaFundingReview_caseId_key`(`caseId`),
    PRIMARY KEY (`id`)
    UNIQUE INDEX `VisaStudyGapReview_caseId_key`(`caseId`),
    PRIMARY KEY (`id`)
    UNIQUE INDEX `VisaRefusalReview_caseId_key`(`caseId`),
    PRIMARY KEY (`id`)
    UNIQUE INDEX `VisaSensitiveReview_caseId_key`(`caseId`),
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    UNIQUE INDEX `AloStudent_studentId_key`(`studentId`),
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    UNIQUE INDEX `CrmUniversity_universityId_key`(`universityId`),
    PRIMARY KEY (`id`)
    UNIQUE INDEX `CrmCourse_courseId_key`(`courseId`),
    INDEX `CrmCourse_universityId_idx`(`universityId`),
    INDEX `CrmCourse_courseTitle_idx`(`courseTitle`),
    INDEX `CrmCourse_subjectArea_idx`(`subjectArea`),
    INDEX `CrmCourse_studyLevel_idx`(`studyLevel`),
    PRIMARY KEY (`id`)
    INDEX `CrmCourseIntakeFee_courseId_idx`(`courseId`),
    INDEX `CrmCourseIntakeFee_universityId_idx`(`universityId`),
    INDEX `CrmCourseIntakeFee_intakeYear_intakeMonth_idx`(`intakeYear`, `intakeMonth`),
    INDEX `CrmCourseIntakeFee_status_idx`(`status`),
    PRIMARY KEY (`id`)
    INDEX `CrmCourseRequirement_courseId_idx`(`courseId`),
    INDEX `CrmCourseRequirement_universityId_idx`(`universityId`),
    PRIMARY KEY (`id`)
    INDEX `CrmScholarship_courseId_idx`(`courseId`),
    INDEX `CrmScholarship_universityId_idx`(`universityId`),
    INDEX `CrmScholarship_status_idx`(`status`),
    PRIMARY KEY (`id`)
    INDEX `CrmCommission_courseId_idx`(`courseId`),
    INDEX `CrmCommission_universityId_idx`(`universityId`),
    INDEX `CrmCommission_intakeYear_intakeMonth_idx`(`intakeYear`, `intakeMonth`),
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    INDEX `CrmImportError_batchId_idx`(`batchId`),
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    UNIQUE INDEX `Employee_userId_key`(`userId`),
    UNIQUE INDEX `Employee_employeeId_key`(`employeeId`),
    PRIMARY KEY (`id`)
    UNIQUE INDEX `EmployeeHRProfile_employeeId_key`(`employeeId`),
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    UNIQUE INDEX `Role_name_key`(`name`),
    PRIMARY KEY (`id`)
    INDEX `RolePermission_roleId_idx`(`roleId`),
    INDEX `RolePermission_permissionId_idx`(`permissionId`),
    UNIQUE INDEX `RolePermission_roleId_permissionId_key`(`roleId`, `permissionId`),
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    INDEX `PartnerLead_partnerId_idx`(`partnerId`),
    INDEX `PartnerLead_status_idx`(`status`),
    INDEX `PartnerLead_studentEmail_idx`(`studentEmail`),
    INDEX `PartnerLead_studentPhone_idx`(`studentPhone`),
    PRIMARY KEY (`id`)
    INDEX `CommunicationThread_studentId_idx`(`studentId`),
    INDEX `CommunicationThread_leadId_idx`(`leadId`),
    INDEX `CommunicationThread_partnerId_idx`(`partnerId`),
    INDEX `CommunicationThread_applicationId_idx`(`applicationId`),
    INDEX `CommunicationThread_assignedToId_idx`(`assignedToId`),
    INDEX `CommunicationThread_status_idx`(`status`),
    PRIMARY KEY (`id`)
    INDEX `CommunicationThreadParticipant_threadId_idx`(`threadId`),
    INDEX `CommunicationThreadParticipant_participantId_idx`(`participantId`),
    UNIQUE INDEX `CommunicationThreadParticipant_threadId_participantId_key`(`threadId`, `participantId`),
    PRIMARY KEY (`id`)
    INDEX `CommunicationMessage_threadId_idx`(`threadId`),
    INDEX `CommunicationMessage_studentId_idx`(`studentId`),
    INDEX `CommunicationMessage_leadId_idx`(`leadId`),
    INDEX `CommunicationMessage_partnerId_idx`(`partnerId`),
    INDEX `CommunicationMessage_applicationId_idx`(`applicationId`),
    INDEX `CommunicationMessage_senderId_idx`(`senderId`),
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    UNIQUE INDEX `PortalRole_name_key`(`name`),
    PRIMARY KEY (`id`)
    UNIQUE INDEX `PortalPermission_module_feature_action_key`(`module`, `feature`, `action`),
    PRIMARY KEY (`id`)
    INDEX `PortalRolePermission_roleId_idx`(`roleId`),
    INDEX `PortalRolePermission_permissionId_idx`(`permissionId`),
    UNIQUE INDEX `PortalRolePermission_roleId_permissionId_key`(`roleId`, `permissionId`),
    PRIMARY KEY (`id`)
    UNIQUE INDEX `PortalUserRole_userId_roleId_key`(`userId`, `roleId`),
    PRIMARY KEY (`id`)
    UNIQUE INDEX `PortalUser_email_key`(`email`),
    PRIMARY KEY (`id`)
    UNIQUE INDEX `PortalSession_token_key`(`token`),
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    INDEX `OtpCode_userId_idx`(`userId`),
    INDEX `OtpCode_email_idx`(`email`),
    INDEX `OtpCode_phone_idx`(`phone`),
    INDEX `OtpCode_code_idx`(`code`),
    PRIMARY KEY (`id`)
    UNIQUE INDEX `PasswordResetToken_tokenHash_key`(`tokenHash`),
    INDEX `PasswordResetToken_userId_idx`(`userId`),
    INDEX `PasswordResetToken_token_idx`(`token`),
    PRIMARY KEY (`id`)
    INDEX `PortalAuditLog_actorUserId_idx`(`actorUserId`),
    INDEX `PortalAuditLog_action_idx`(`action`),
    INDEX `PortalAuditLog_entityType_entityId_idx`(`entityType`, `entityId`),
    PRIMARY KEY (`id`)
    UNIQUE INDEX `PortalStudentProfile_userId_key`(`userId`),
    UNIQUE INDEX `PortalStudentProfile_studentId_key`(`studentId`),
    PRIMARY KEY (`id`)
    UNIQUE INDEX `EmployeeProfile_userId_key`(`userId`),
    UNIQUE INDEX `EmployeeProfile_employeeId_key`(`employeeId`),
    PRIMARY KEY (`id`)
    INDEX `EmployeeActivationToken_tokenHash_idx`(`tokenHash`),
    INDEX `EmployeeActivationToken_employeeId_idx`(`employeeId`),
    PRIMARY KEY (`id`)
    UNIQUE INDEX `PartnerProfile_userId_key`(`userId`),
    UNIQUE INDEX `PartnerProfile_partnerId_key`(`partnerId`),
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    INDEX `StudentReferral_studentProfileId_idx`(`studentProfileId`),
    INDEX `StudentReferral_referrerId_idx`(`referrerId`),
    INDEX `StudentReferral_referredEmail_idx`(`referredEmail`),
    PRIMARY KEY (`id`)
    INDEX `PortalNotification_userId_idx`(`userId`),
    INDEX `PortalNotification_studentProfileId_idx`(`studentProfileId`),
    INDEX `PortalNotification_isRead_idx`(`isRead`),
    PRIMARY KEY (`id`)
    UNIQUE INDEX `Country_slug_key`(`slug`),
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    UNIQUE INDEX `WebsiteEnglishTest_slug_key`(`slug`),
    PRIMARY KEY (`id`)
    UNIQUE INDEX `HomeService_slug_key`(`slug`),
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    UNIQUE INDEX `PartnerPackage_name_key`(`name`),
    UNIQUE INDEX `PartnerPackage_slug_key`(`slug`),
    PRIMARY KEY (`id`)
    UNIQUE INDEX `PartnerQuota_partnerId_key`(`partnerId`),
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    UNIQUE INDEX `PartnerMarketingQuota_partnerId_key`(`partnerId`),
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    UNIQUE INDEX `StudentMockTestVoucher_voucherCode_key`(`voucherCode`),
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    UNIQUE INDEX `HomeSection_sectionKey_key`(`sectionKey`),
    PRIMARY KEY (`id`)
    UNIQUE INDEX `PermissionPackage_name_key`(`name`),
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    UNIQUE INDEX `EmployeeCommunicationProfile_employeeId_key`(`employeeId`),
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
    PRIMARY KEY (`id`)
