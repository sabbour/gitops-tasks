import path from "path";
import assert from "assert";
import ttm from 'vsts-task-lib/mock-test';

describe('GitOps update build number test', function () {
    before(() => {

    });

    after(() => {

    });


    it('should succeed with build reason PullRequest', (done: MochaDone) => {
        this.timeout(1000);

        let tp = path.join(__dirname, 'from-pullrequest.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();
        assert(tr.succeeded, 'should have succeeded');
        assert.equal(tr.warningIssues.length, 0, "should have no warnings");
        assert.equal(tr.errorIssues.length, 0, "should have no errors");
        assert(tr.stdout.indexOf('##vso[build.updatebuildnumber]development-pr-2-d6cd1e2-42') >= 0, "tool stdout");

        done();
    });

    it('should fail with build reason PullRequest without pr number', (done: MochaDone) => {
        this.timeout(1000);

        let tp = path.join(__dirname, 'from-pullreques-missingprnum.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();
        assert(!tr.succeeded, 'should not succeed');

        done();
    });

    it('should succeed build reason IndividualCI', (done: MochaDone) => {
        this.timeout(1000);

        let tp = path.join(__dirname, 'from-individualci.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();
        assert(tr.succeeded, 'should have succeeded');
        assert.equal(tr.warningIssues.length, 0, "should have no warnings");
        assert.equal(tr.errorIssues.length, 0, "should have no errors");
        assert(tr.stdout.indexOf('##vso[build.updatebuildnumber]development-d6cd1e2-42') >= 0, "tool stdout");

        done();
    });
});