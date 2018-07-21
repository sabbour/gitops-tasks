import tl = require('vsts-task-lib/task');
import * as gitops from "common-gitops";
import * as gitInterfaces from "vso-node-api/interfaces/GitInterfaces";

var pullRequestId: string;

async function run() {
    var commitId: string = tl.getVariable('Build.SourceVersion');
    console.log("commitId: " + commitId);

    // If no commit id, probably this is a manual build
    // nothing to do here, moving on
    if(commitId == undefined) {
        tl.setResult(tl.TaskResult.Succeeded, "Skipping. No commit id, nothing to do here.");
    }

    try {
        pullRequestId = await gitops.getPullRequestIdByCommitIdAsync(commitId);
        console.log("prNumber: " + pullRequestId);
    }
    catch (err) {
        console.log("Could not get pull request number of this commit");
    }
    // Ok, we have the pull request number, let's check if this pull request has been closed/merged
    // and update the output variables
    gitops.setOutputVariable("prnumber",pullRequestId);

    if(pullRequestId != undefined) {
        // Get the pull request details
        let prNumber = Number.parseInt(pullRequestId);
        let pr = await gitops.getPullRequestByIdAsync(prNumber);
        gitops.setOutputVariable("mergestatus",gitInterfaces.PullRequestAsyncStatus[pr.mergeStatus]);
        gitops.setOutputVariable("prstatus",gitInterfaces.PullRequestStatus[pr.status]);
        tl.setResult(tl.TaskResult.Succeeded, "Updated prnumber, mergestatus, prstatus output vars.");
    } else {
        tl.setResult(tl.TaskResult.Succeeded, "Skipping. No pull request id, nothing to do here.");
    }
}

function sleep(ms = 0) {
    return new Promise(r => setTimeout(r, ms));
}


run();