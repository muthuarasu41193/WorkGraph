import { DATA_CATEGORIES, BACKUP_RETENTION_SENTENCE } from "@/lib/legal";

import { ACCOUNT_TABLES, type DeleteStrategy } from "./data-map";

function retention(category: string): string {
  const row = DATA_CATEGORIES.find((item) => item.category === category);
  if (!row) {
    throw new Error("Missing data category");
  }
  return row.retention;
}

function labels(strategy: DeleteStrategy): string[] {
  return ACCOUNT_TABLES.filter((table) => table.deleteStrategy === strategy).map((table) => table.label);
}

export type AccountDataRights = {
  export: string;
  deletion: string;
  removed: string[];
  unlinked: string[];
  kept: string[];
  payments: string;
  consent: string;
  backup: string;
  cascade: string;
  deletedBanner: string;
};

export function accountDataRights(): AccountDataRights {
  const payments = retention("Payment records");
  const consent = retention("Device / analytics");
  const backup = BACKUP_RETENTION_SENTENCE;
  return {
    export:
      "In Settings, open Your data and choose Download my data. The file is JSON and contains only your rows: profile (including resume text and resume file details), applications, cover letters, Talent Intelligence reports, Interview Vault guides you published, purchases and reviews you wrote, employer profile, hiring signals you posted, connections you sent, and the other rows listed in the product. It does not include other people's data. It does not include a link that opens someone else's files. Downloads are limited to a few times per hour.",
    deletion:
      "In Settings, open Your data and choose Delete my account. You must type DELETE. We remove resume files and profile photos stored in your account folder, delete or unlink the rows below, then delete the login. You are signed out and taken to the homepage. If deletion stops halfway, run it again. Steps that already finished are safe to repeat.",
    removed: [
      ...labels("delete"),
      "Resume files in your account folder",
      "Profile photos in your account folder",
    ],
    unlinked: labels("anonymise"),
    kept: labels("keep-for-legal"),
    payments,
    consent,
    backup,
    cascade:
      "Guides you published are deleted. Purchase records that point at those guides are removed with them, including purchases other people made, because those records are tied to the guide. Connections other people sent to hiring signals you posted are removed with those signals.",
    deletedBanner: `Your account has been deleted. ${backup} Payment records stay with the user id removed. Consent audit rows stay with the user id removed.`,
  };
}
