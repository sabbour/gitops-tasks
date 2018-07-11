import tl = require('vsts-task-lib/task');
import trm = require('vsts-task-lib/toolrunner');
import { WebApi } from 'vso-node-api/WebApi';
import { access } from 'fs';

async function run() {
    // If not running on a Pull Request, stop
    //stopOnNonPrBuild();

    try {
        var comment: string = tl.getInput("comment",true);
        var accountUri: string = tl.getVariable("System.TeamFoundationCollectionUri");
        var accessToken: string = tl.getVariable("System.AccessToken");
        var projectName: string = tl.getVariable("System.TeamProject");
        var repoName: string = tl.getVariable("Build.Repository.Name");
        var buildNumber: string = tl.getVariable("Build.BuildNumber");
        var prNumber: string = tl.getVariable("System.PullRequest.PullRequestId");
        var accessToken2 = getBearerToken();

        console.log("accessToken: " + accessToken);
        console.log("accessToken2: " + accessToken2);
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

function stopOnNonPrBuild() {

    tl.debug('Checking if this is a PR build');
    var sourceBranch: string = tl.getVariable('Build.SourceBranch');
    if (!sourceBranch.startsWith('refs/pull/')) {
        // ="Skipping pull request commenting - this build was not triggered by a pull request."
        console.log("Not triggered by a Pull Request, skipping.");
        process.exit();
    }
}

function getBearerToken() {

    tl.debug('[PRCA] Getting the agent bearer token');

    // Get authentication from the agent itself
    var auth = tl.getEndpointAuthorization('SYSTEMVSSCONNECTION', false);
    if (auth.scheme !== 'OAuth') {
        // Looks like: "Could not get an authentication token from the build agent."
        console.log("Could not get an authentication token from the build agent.");
    }

    return auth.parameters['AccessToken'];
}

run();