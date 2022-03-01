import { Random } from "../test_lib/random/Random";
import { CharSequence } from "../test_lib/sequence-types/CharSequence";
import { InternalDocument, SequenceElementType, SequenceTypeImplementation } from "../test_lib/sequence-types/CoreTypes";
import { RgaCvrdt } from "../test_lib/sequence-types/RgaCvrdt";
import { CharGenerator } from "./CharGenerator";
import { generateOpsAndTest, SequenceElementGenerator } from "./GenerateOpsAndTest";

runIterated(CharSequence, () => new CharGenerator(), new RgaCvrdt(CharSequence), 10000);

function runIterated<TInternalDocument extends InternalDocument<TSequenceElement, TInternalDocument>, TOperation, TSequenceElement, TSequenceElementIdentity>(
    sequenceElementType: SequenceElementType<TSequenceElement, TSequenceElementIdentity>,
    createNewSequenceElementGeneratorFn: () => SequenceElementGenerator<TSequenceElement>,
    sequenceTypeImplementation: SequenceTypeImplementation<TSequenceElement, TOperation, TInternalDocument>,
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
