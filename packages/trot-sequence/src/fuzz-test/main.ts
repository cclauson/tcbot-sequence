import { Random } from "../test-lib/random/Random";
import { charSequence } from "../test-lib/sequence-types/CharSequence";
import { InternalDocument, SequenceElementType, SequenceTypeImplementation } from "../test-lib/sequence-types/CoreTypes";
import { Rga } from "../test-lib/rga/Rga";
import { CharGenerator } from "./CharGenerator";
import { generateOpsAndTest, SequenceElementGenerator } from "./GenerateOpsAndTest";

function compareNumbers(n1: number, n2: number): number {
    return n1 - n2;
}

runIterated(charSequence, () => new CharGenerator(), new Rga(charSequence, compareNumbers), 10000);

function runIterated<TInternalDocument extends InternalDocument<TSequenceElement, TInternalDocument, TOperation, number>, TOperation, TSequenceElement, TSequenceElementIdentity>(
    sequenceElementType: SequenceElementType<TSequenceElement, TSequenceElementIdentity>,
    createNewSequenceElementGeneratorFn: () => SequenceElementGenerator<TSequenceElement>,
    sequenceTypeImplementation: SequenceTypeImplementation<TSequenceElement, TOperation, number, TInternalDocument>,
    numRuns: number,
    seed?: string
) {
    const random = new Random(seed);

    let failures = false;

    for(let i = 0; i < numRuns; ++i) {
        const seed = random.getSeed();
        const generator = createNewSequenceElementGeneratorFn();
        try {
            const result = generateOpsAndTest(sequenceElementType, generator, sequenceTypeImplementation, random);    
            if (result) {
                failures = true;
                console.log(`failed with message: ${result}`);
                console.log('==seed===========================');
                console.log(seed);
                console.log('=================================');
            }
        } catch (e) {
            failures = true;
            console.log(`uncaught exception: ${e}`);
            console.log('==seed===========================');
            console.log(seed);
            console.log('=================================');
        }
    }

    console.log(`${numRuns} test runs completed.`);

    if (failures) {
        console.log('some runs failed, see details above');
    } else {
        console.log('all runs successful');
    }
}
