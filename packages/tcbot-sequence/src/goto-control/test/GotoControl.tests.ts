import { expect } from "chai";
import { merge } from "../Merge";
import { TestRequest } from "./TestRequest";

describe('GOTO control algorithm', () => {
    it('Handles an empty log', () => {
        const newRequest = new TestRequest('new');
        const opResult = merge([], newRequest);
        expect(opResult.equals(newRequest.operation)).to.be.true;
        expect(opResult.numTimesTransformed()).to.equal(0);
    });

    it('Log with one non-concurrent op', () => {
        const op1 = new TestRequest('op1');
        const log = [op1];
        const causallyPrecedingSet = new Set<TestRequest>();
        causallyPrecedingSet.add(op1);
        const newRequest = new TestRequest('new', causallyPrecedingSet);
        const opResult = merge(log, newRequest);
        expect(opResult.equals(newRequest.operation)).to.be.true;
        expect(opResult.numTimesTransformed()).to.equal(0);
    });

    it('Log with sequence of non-concurrent ops', () => {
        const causallyPrecedingSet = new Set<TestRequest>();
        const log = [];
        for (let i = 0; i < 5; ++i) {
            const op = new TestRequest(`op${i}`, causallyPrecedingSet);
            log.push(op);
            causallyPrecedingSet.add(op);
        }
        const newRequest = new TestRequest('new', causallyPrecedingSet);
        const opResult = merge(log, newRequest);
        expect(opResult.equals(newRequest.operation)).to.be.true;
        expect(opResult.numTimesTransformed()).to.equal(0);
    });

    it('Log with one concurrent op', () => {
        const op1 = new TestRequest('op1');
        const log = [op1];
        const newRequest = new TestRequest('new');
        const opResult = merge(log, newRequest);
        expect(opResult.equals(newRequest.operation.inclusionTransformAgainst(op1.operation))).to.be.true;
        expect(opResult.numTimesTransformed()).to.equal(1);
    });

    it('Log with sequence of concurrent ops', () => {
        const causallyPrecedingSet = new Set<TestRequest>();
        const log = [];
        for (let i = 0; i < 5; ++i) {
            const op = new TestRequest(`op${i}`, causallyPrecedingSet);
            log.push(op);
            causallyPrecedingSet.add(op);
        }
        const newRequest = new TestRequest('new');
        const opResult = merge(log, newRequest);

        let op = newRequest.operation;
        for (let i = 0; i < 5; ++i) {
            op = op.inclusionTransformAgainst(log[i].operation);
        }
        
        expect(opResult.equals(op)).to.be.true;
        expect(opResult.numTimesTransformed()).to.equal(5);
    });
});