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

    it('Log with interspersed concurrent and non-concurrent ops', () => {
        const causallyPrecedingSet = new Set<TestRequest>();
        const op1 = new TestRequest('op1', causallyPrecedingSet);
        const op2 = new TestRequest('op2', causallyPrecedingSet);
        causallyPrecedingSet.add(op2);
        const op3 = new TestRequest('op3', causallyPrecedingSet);
        const op4 = new TestRequest('op4', causallyPrecedingSet);
        const op5 = new TestRequest('op5', causallyPrecedingSet);
        causallyPrecedingSet.add(op5);
        const newRequest = new TestRequest('new', causallyPrecedingSet);
        const log = [op1, op2, op3, op4, op5];
        const opResult = merge(log, newRequest);
        const logSequenceExpected = ['op2', 'op5', 'op1', 'op3', 'op4'];
        for (let i = 0; i < 5; ++i) {
            expect(log[i].name).to.equal(logSequenceExpected[i]);
        }
        expect(log[0].operation.numTimesTransformed()).to.equal(1);
        expect(log[1].operation.numTimesTransformed()).to.equal(3);
        expect(opResult.numTimesTransformed()).to.equal(3);
    });
});