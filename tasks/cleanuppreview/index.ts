import tl = require('vsts-task-lib/task');
import * as gitops from "common-gitops";


var prNumber: string;

async function run() {
    try {
        var commitId: string = tl.getVariable('Build.SourceVersion');
        console.log("commitId: " + commitId);

        prNumber = await gitops.getPullRequestIdByCommitIdAsync(commitId);
        console.log("prNumber: " + prNumber);
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

function sleep(ms = 0) {
    return new Promise(r => setTimeout(r, ms));
}


run();