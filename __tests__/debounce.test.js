import FakeTimers from "@sinonjs/fake-timers";
import debounce from "lodash.debounce";
import { reaction, observable } from "mobx";

let clock = FakeTimers.install();

describe("given a function", () => {
    let fn;

    beforeEach(() => {
         fn = jest.fn();
    });

    describe("when the function is debounced by lodash.debounce for 500ms with trailing debounce", () => {
        let debouncedFn;

        beforeEach(() => {
            debouncedFn = debounce(fn, 500, { leading: false, trailing: true });
        });

        describe.each`
            intervals
            ${[100, 200, 300, 400]}
            ${[100, 300, 200]}
            ${[100, 100, 100]}
        `("When the debounced function is called $intervals.length times within 500ms", ({ intervals }) => {
            beforeEach(() => {
                intervals.forEach((interval, call) => {
                    debouncedFn(`Call: ${call}`);
                    clock.tick(interval);
                });
            });

            it("it should only call the function the last time after 500ms", () => {
                clock.tick(500); // trailing debounce period

                expect(fn).toHaveBeenCalledWith(`Call: ${intervals.length - 1}`);
                expect(fn).toHaveBeenCalledTimes(1);
            });
        })
    });

    describe("when the function is debounced by lodash.debounce for 500ms with leading debounce", () => {
        let debouncedFn;

        beforeEach(() => {
            debouncedFn = debounce(fn, 500, { leading: true, trailing: false });
        });

        describe.each`
            intervals
            ${[100, 200, 300, 400]}
            ${[100, 300, 200]}
            ${[100, 100, 100]}
        `("When the debounced function is called $intervals.length times within 500ms", ({ intervals }) => {
            beforeEach(() => {
                intervals.forEach((interval, call) => {
                    debouncedFn(`Call: ${call}`);
                    clock.tick(interval);
                });
            });

            it("it should only call the function the first time", () => {
                expect(fn).toHaveBeenCalledTimes(1);
                expect(fn).toHaveBeenCalledWith(`Call: 0`);
            });
        })
    });

    describe("when the function is called by a delayed mbox reaction for 500ms", () => {
        let disposer;
        let calls;

        beforeEach(() => {
            calls = observable([]);
            disposer = reaction(
                () => calls.length,
                call => fn(call),
                { name: "reaction(calls.length)", delay: 500 }
            );
        });

        describe.each`
            intervals
            ${[100, 200, 300, 400]}
            ${[100, 300, 200]}
            ${[100, 100, 100]}
        `("When the reaction is triggered $intervals.length times within 500ms", ({ intervals }) => {
            beforeEach(() => {
                intervals.forEach((interval, call) => {
                    calls.push(call);
                    clock.tick(interval);
                });
            });

            it("it should only call the function the first time", () => {
                clock.tick(500); // wait for delay

                // will fail test
                expect(fn).toHaveBeenCalledTimes(1);
                expect(fn).toHaveBeenCalledWith(`Call: ${intervals.length - 1}`);
            });
        });

        afterEach(() => {
            disposer();
        })
    });
});