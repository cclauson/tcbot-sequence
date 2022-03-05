import { charSequence } from "../../sequence-types/CharSequence";
import { RgaCvrdt } from "../RgaCvrdt";
import { createTests } from "../../sequence-types/CreateTests";

const rgaCvrdt = new RgaCvrdt(charSequence);
createTests('RGA CVRDT implementation', rgaCvrdt);
