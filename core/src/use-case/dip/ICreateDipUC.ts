import { Dip } from "../../entity/Dip";

export interface ICreateDipUC {
  execute(dip: Dip): Dip;
}
