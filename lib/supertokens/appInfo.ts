import { appOrigin } from "../auth/config";

export const supertokensAppInfo = {
  appName: "WorkGraph",
  apiDomain: appOrigin(),
  websiteDomain: appOrigin(),
  apiBasePath: "/api/auth",
  websiteBasePath: "/auth",
};
