CREATE TABLE IF NOT EXISTS `qa_user` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `password` varchar(191) NOT NULL,
  `role` varchar(191) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `logo` varchar(512) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `qa_user_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `qa_project` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `code` varchar(16) DEFAULT NULL,
  `type` enum('tasks','issues') NOT NULL DEFAULT 'tasks',
  `url` varchar(2048) DEFAULT NULL,
  `rsvpUrl` varchar(2048) DEFAULT NULL,
  `figmaUrl` varchar(2048) DEFAULT NULL,
  `deadline` datetime(3) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'active',
  `ownerId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `qa_project_code_key` (`code`),
  KEY `qa_project_ownerId_fkey` (`ownerId`),
  KEY `qa_project_type_idx` (`type`),
  CONSTRAINT `qa_project_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `qa_user` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `qa_project_member` (
  `id` varchar(191) NOT NULL,
  `projectId` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `team` varchar(32) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `qa_project_member_unique` (`projectId`,`userId`,`team`),
  KEY `qa_project_member_userId_fkey` (`userId`),
  CONSTRAINT `qa_project_member_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `qa_project` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `qa_project_member_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `qa_user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `qa_module` (
  `id` varchar(191) NOT NULL,
  `projectId` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `qa_module_projectId_fkey` (`projectId`),
  CONSTRAINT `qa_module_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `qa_project` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `qa_page` (
  `id` varchar(191) NOT NULL,
  `projectId` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Page_projectId_name_key` (`projectId`,`name`),
  CONSTRAINT `qa_page_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `qa_project` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `qa_page_task` (
  `id` varchar(191) NOT NULL,
  `projectId` varchar(191) NOT NULL,
  `pageId` varchar(191) NOT NULL,
  `kind` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `details` text DEFAULT NULL,
  `priority` varchar(191) NOT NULL DEFAULT 'P2',
  `status` varchar(191) NOT NULL DEFAULT 'open',
  `labels` varchar(191) DEFAULT NULL,
  `linkedTaskIds` text DEFAULT NULL,
  `parentId` varchar(191) DEFAULT NULL,
  `assigneeId` varchar(191) DEFAULT NULL,
  `assigneeIds` text DEFAULT NULL,
  `reporterId` varchar(191) DEFAULT NULL,
  `firstResponseAt` datetime(3) DEFAULT NULL,
  `resolutionAt` datetime(3) DEFAULT NULL,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `number` int(11) NOT NULL DEFAULT 0,
  `taskKey` varchar(32) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `qa_page_task_projectId_idx` (`projectId`),
  KEY `qa_page_task_pageId_idx` (`pageId`),
  UNIQUE KEY `qa_page_task_projectId_number_key` (`projectId`,`number`),
  UNIQUE KEY `qa_page_task_taskKey_key` (`taskKey`),
  KEY `qa_page_task_assigneeId_fkey` (`assigneeId`),
  KEY `qa_page_task_reporterId_fkey` (`reporterId`),
  KEY `qa_page_task_parentId_fkey` (`parentId`),
  CONSTRAINT `qa_page_task_pageId_fkey` FOREIGN KEY (`pageId`) REFERENCES `qa_page` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `qa_page_task_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `qa_project` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `qa_page_task_assigneeId_fkey` FOREIGN KEY (`assigneeId`) REFERENCES `qa_user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `qa_page_task_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `qa_user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `qa_page_task_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `qa_page_task` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `qa_page_task_comment` (
  `id` varchar(191) NOT NULL,
  `taskId` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `body` text NOT NULL,
  `visibility` varchar(191) NOT NULL DEFAULT 'internal',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `qa_page_task_comment_taskId_fkey` (`taskId`),
  KEY `qa_page_task_comment_userId_fkey` (`userId`),
  CONSTRAINT `qa_page_task_comment_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `qa_page_task` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `qa_page_task_comment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `qa_user` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `qa_page_task_attachment` (
  `id` varchar(191) NOT NULL,
  `taskId` varchar(191) NOT NULL,
  `commentId` varchar(191) DEFAULT NULL,
  `userId` varchar(191) NOT NULL,
  `fileName` varchar(191) NOT NULL,
  `mimeType` varchar(191) NOT NULL,
  `size` int(11) NOT NULL,
  `path` varchar(512) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `qa_page_task_attachment_taskId_fkey` (`taskId`),
  KEY `qa_page_task_attachment_commentId_fkey` (`commentId`),
  KEY `qa_page_task_attachment_userId_fkey` (`userId`),
  CONSTRAINT `qa_page_task_attachment_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `qa_page_task` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `qa_page_task_attachment_commentId_fkey` FOREIGN KEY (`commentId`) REFERENCES `qa_page_task_comment` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `qa_page_task_attachment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `qa_user` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `qa_test_case` (
  `id` varchar(191) NOT NULL,
  `caseKey` varchar(191) NOT NULL,
  `projectId` varchar(191) NOT NULL,
  `moduleId` varchar(191) NOT NULL,
  `pageId` varchar(191) DEFAULT NULL,
  `title` varchar(191) NOT NULL,
  `priority` varchar(191) NOT NULL DEFAULT 'P2',
  `preconditions` text DEFAULT NULL,
  `steps` text NOT NULL,
  `expected` text NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'ready',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `qa_test_case_projectId_caseKey_key` (`projectId`,`caseKey`),
  KEY `qa_test_case_moduleId_fkey` (`moduleId`),
  KEY `qa_test_case_pageId_fkey` (`pageId`),
  CONSTRAINT `qa_test_case_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `qa_project` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `qa_test_case_moduleId_fkey` FOREIGN KEY (`moduleId`) REFERENCES `qa_module` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `qa_test_case_pageId_fkey` FOREIGN KEY (`pageId`) REFERENCES `qa_page` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `qa_test_run` (
  `id` varchar(191) NOT NULL,
  `projectId` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `build` varchar(191) DEFAULT NULL,
  `dueDate` datetime(3) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'open',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `qa_test_run_projectId_fkey` (`projectId`),
  CONSTRAINT `qa_test_run_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `qa_project` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `qa_run_item` (
  `id` varchar(191) NOT NULL,
  `runId` varchar(191) NOT NULL,
  `caseId` varchar(191) NOT NULL,
  `assigneeId` varchar(191) DEFAULT NULL,
  `result` varchar(191) NOT NULL DEFAULT 'pending',
  `actualResult` text DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `startedAt` datetime(3) DEFAULT NULL,
  `finishedAt` datetime(3) DEFAULT NULL,
  `dueDate` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `qa_run_item_runId_fkey` (`runId`),
  KEY `qa_run_item_caseId_fkey` (`caseId`),
  KEY `qa_run_item_assigneeId_fkey` (`assigneeId`),
  CONSTRAINT `qa_run_item_runId_fkey` FOREIGN KEY (`runId`) REFERENCES `qa_test_run` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `qa_run_item_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `qa_test_case` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `qa_run_item_assigneeId_fkey` FOREIGN KEY (`assigneeId`) REFERENCES `qa_user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `qa_fix_task` (
  `id` varchar(191) NOT NULL,
  `fixKey` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `runItemId` varchar(191) NOT NULL,
  `severity` varchar(191) NOT NULL,
  `assigneeId` varchar(191) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'open',
  `steps` text DEFAULT NULL,
  `fixerNotes` text DEFAULT NULL,
  `dueDate` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `qa_fix_task_fixKey_key` (`fixKey`),
  KEY `qa_fix_task_runItemId_fkey` (`runItemId`),
  KEY `qa_fix_task_assigneeId_fkey` (`assigneeId`),
  CONSTRAINT `qa_fix_task_runItemId_fkey` FOREIGN KEY (`runItemId`) REFERENCES `qa_run_item` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `qa_fix_task_assigneeId_fkey` FOREIGN KEY (`assigneeId`) REFERENCES `qa_user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `qa_activity` (
  `id` varchar(191) NOT NULL,
  `entityType` varchar(191) NOT NULL,
  `entityId` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `message` text NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `qa_activity_userId_fkey` (`userId`),
  CONSTRAINT `qa_activity_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `qa_user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `qa_role_access` (
  `role` varchar(40) NOT NULL,
  `capability` varchar(40) NOT NULL,
  PRIMARY KEY (`role`, `capability`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `qa_work_report` (
  `id` varchar(191) NOT NULL,
  `projectId` varchar(191) NOT NULL,
  `taskId` varchar(191) DEFAULT NULL,
  `userId` varchar(191) NOT NULL,
  `kind` varchar(32) NOT NULL,
  `body` text DEFAULT NULL,
  `dueAt` datetime(3) DEFAULT NULL,
  `submittedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `qa_work_report_projectId_idx` (`projectId`),
  KEY `qa_work_report_userId_fkey` (`userId`),
  CONSTRAINT `qa_work_report_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `qa_project` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `qa_work_report_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `qa_user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
