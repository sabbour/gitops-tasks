import tl = require('vsts-task-lib/task');
import * as gitops from "common-gitops";


var prNumber: string;

async function run() {
    try {
        var commitId: string = tl.getVariable('Build.SourceVersion');
        console.log("commitId: " + commitId);

        // If no commit id, probably this is a manual build
        // nothing to do here, moving on
        if(commitId == undefined) {
            tl.setResult(tl.TaskResult.Succeeded, "Skipping. No commit id, nothing to do here.");
        }

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