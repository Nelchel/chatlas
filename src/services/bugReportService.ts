import { collection, doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { uploadBugReportScreenshot } from "./supabaseStorage";
import { uid } from "../utils/id";

export interface BugReport {
  id: string;
  user_id: string;
  description: string;
  screenshot_url?: string;
  app_version: string;
  created_at: string;
}

interface BugReportDoc {
  id: string;
  userId: string;
  description: string;
  screenshotUrl: string;
  appVersion: string;
  createdAt: Timestamp;
}

function toDoc(report: BugReport): BugReportDoc {
  return {
    id: report.id,
    userId: report.user_id,
    description: report.description,
    screenshotUrl: report.screenshot_url || "",
    appVersion: report.app_version,
    createdAt: Timestamp.fromDate(new Date(report.created_at)),
  };
}

export const BugReportService = {
  async create(
    userId: string,
    description: string,
    appVersion: string,
    screenshotUri?: string
  ): Promise<BugReport> {
    if (!db) throw new Error("Firestore non initialisé");

    const id = uid();
    let screenshotUrl = "";

    if (screenshotUri && !screenshotUri.startsWith("http")) {
      const uploaded = await uploadBugReportScreenshot(screenshotUri, userId, id);
      if (uploaded) screenshotUrl = uploaded;
    }

    const report: BugReport = {
      id,
      user_id: userId,
      description: description.trim(),
      screenshot_url: screenshotUrl || undefined,
      app_version: appVersion,
      created_at: new Date().toISOString(),
    };

    const docRef = doc(collection(db, "bugReports"), id);
    await setDoc(docRef, toDoc(report));

    return report;
  },
};
