import { charSequence } from "../../sequence-types/CharSequence";
import { RgaCvrdt } from "../RgaCvrdt";
import { createTests } from "../../sequence-types/CreateTests";

function compareNumbers(n1: number, n2: number): number {
    return n1 - n2;
}

const rgaCvrdt = new RgaCvrdt(charSequence, compareNumbers);
createTests('RGA CVRDT implementation', rgaCvrdt);
