import { Upd } from "../common/tables/IItem";
import { IInventoryBaseActionRequestData } from "./IInventoryBaseActionRequestData";
export interface IInventorySortRequestData extends IInventoryBaseActionRequestData {
    Action: "ApplyInventoryChanges";
    changedItems: ChangedItem[];
}
export interface ChangedItem {
    _id: string;
    _tpl: string;
    parentId: string;
    slotId: string;
    location: Location;
    upd: Upd;
}
export interface Location {
    x: number;
    y: number;
    r: string;
    isSearched: boolean;
}
