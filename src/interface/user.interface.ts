import { RoleType } from "../constants.js";
import { IPagination } from "./index.interface.js";

export interface getUsersInfoServiceParams
  extends IPagination {
  role: RoleType
}
