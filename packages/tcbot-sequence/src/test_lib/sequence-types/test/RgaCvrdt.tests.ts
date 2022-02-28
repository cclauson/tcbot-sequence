import { CharSequence } from "../CharSequence";
import { RgaCvrdt } from "../RgaCvrdt";
import { createTests } from "./CreateTests";

const rgaCvrdt = new RgaCvrdt(CharSequence);
createTests('RGA CVRDT implementation', rgaCvrdt);
