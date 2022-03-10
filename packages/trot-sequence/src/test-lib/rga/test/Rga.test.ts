import { charSequence } from "../../sequence-types/CharSequence";
import { Rga } from "../Rga";
import { createTests } from "../../sequence-types/CreateTests";

function compareNumbers(n1: number, n2: number): number {
    return n1 - n2;
}

const rga = new Rga(charSequence, compareNumbers);
createTests('RGA CVRDT implementation', rga);
