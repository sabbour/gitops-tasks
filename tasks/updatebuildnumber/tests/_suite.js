"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const assert_1 = __importDefault(require("assert"));
const mock_test_1 = __importDefault(require("vsts-task-lib/mock-test"));
describe('GitOps update build number test', function () {
    before(() => {
    });
    after(() => {
    });
    it('should succeed with build reason PullRequest', (done) => {
        this.timeout(1000);
        let tp = path_1.default.join(__dirname, 'from-pullrequest.js');
        let tr = new mock_test_1.default.MockTestRunner(tp);
        tr.run();
        assert_1.default(tr.succeeded, 'should have succeeded');
        assert_1.default.equal(tr.warningIssues.length, 0, "should have no warnings");
        assert_1.default.equal(tr.errorIssues.length, 0, "should have no errors");
        assert_1.default(tr.stdout.indexOf('##vso[build.updatebuildnumber]development-pr-2-d6cd1e2-42') >= 0, "tool stdout");
        done();
    });
    it('should fail with build reason PullRequest without pr number', (done) => {
        this.timeout(1000);
        let tp = path_1.default.join(__dirname, 'from-pullreques-missingprnum.js');
        let tr = new mock_test_1.default.MockTestRunner(tp);
        tr.run();
        assert_1.default(!tr.succeeded, 'should not succeed');
        done();
    });
    it('should succeed build reason IndividualCI', (done) => {
        this.timeout(1000);
        let tp = path_1.default.join(__dirname, 'from-individualci.js');
        let tr = new mock_test_1.default.MockTestRunner(tp);
        tr.run();
        assert_1.default(tr.succeeded, 'should have succeeded');
        assert_1.default.equal(tr.warningIssues.length, 0, "should have no warnings");
        assert_1.default.equal(tr.errorIssues.length, 0, "should have no errors");
        assert_1.default(tr.stdout.indexOf('##vso[build.updatebuildnumber]development-d6cd1e2-42') >= 0, "tool stdout");
        done();
    });
});
//# sourceMappingURL=_suite.js.map