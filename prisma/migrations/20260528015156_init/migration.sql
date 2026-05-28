-- CreateTable
CREATE TABLE "OsceScenario" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "spec" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "twilioNumber" TEXT,
    "dograhWorkflowIdTraining" TEXT,
    "dograhWorkflowIdExam" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OsceScenario_pkey" PRIMARY KEY ("id")
);
