import tl = require('vsts-task-lib/task');
import trm = require('vsts-task-lib/toolrunner');
import * as web from 'vso-node-api/WebApi';
import { WebApi } from 'vso-node-api/WebApi';
import { IGitApi } from 'vso-node-api/GitApi';
import * as gitInterfaces from 'vso-node-api/interfaces/GitInterfaces';

var gitClient: IGitApi;
var repoId: string;
var prNumber: number;

async function run() {
    // If not running on a Pull Request, stop
    stopOnNonPrBuild();

    try {
        var wait = tl.getBoolInput("wait", true);
        var accountUri: string = tl.getVariable("System.TeamFoundationCollectionUri");
        var accessToken = getBearerToken();
        repoId = tl.getVariable("Build.Repository.Id");
        prNumber = getPullRequestId();
        var creds = web.getBearerHandler(accessToken);
        var connection = new WebApi(accountUri, creds);
        gitClient = connection.getGitApi();

        var pr;
        console.log("prNumber: " + prNumber);
        console.log("wait: " + wait);

        pr = await gitClient.getPullRequestById(prNumber);
        while(pr.status == gitInterfaces.PullRequestStatus.Active) {
            if(!wait)
                break;
            else {
                pr = await gitClient.getPullRequestById(prNumber);
                await sleep(1000);
            }
        }

        // Set it
        console.log("PR status: " + pr.status);
        console.log("PR mergeStatus: " + pr.mergeStatus);
        console.log("PR closedBy: " + pr.closedBy.displayName);
        console.log("PR closedDate: " + pr.closedDate);
        console.log("##vso[task.setvariable variable=prstatus;isOutput=true;]"+pr.status);
        console.log("##vso[task.setvariable variable=mergestatus;isOutput=true;]"+pr.mergeStatus);
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

function sleep(ms = 0) {
    return new Promise(r => setTimeout(r, ms));
}

function stopOnNonPrBuild() {

    tl.debug('Checking if this is a PR build');
    var sourceBranch: string = tl.getVariable('Build.SourceBranch');
    if (sourceBranch!=undefined && !sourceBranch.startsWith('refs/pull/')) {
        // ="Skipping pull request commenting - this build was not triggered by a pull request."
        console.log("Not triggered by a Pull Request, skipping.");
        process.exit();
    }
}

function getPullRequestId() {
    let sourceBranch: string = tl.getVariable('Build.SourceBranch');
    if(sourceBranch==undefined) {
        console.log(`Expected pull request ID to be defined.`);
        tl.setResult(tl.TaskResult.Failed, "Could not retrieve pull request ID from the server.");
        process.exit(1);
    }

    var pullRequestId: number = Number.parseInt(sourceBranch.replace('refs/pull/', ''));

    if (isNaN(pullRequestId)) {
        console.log(`Expected pull request ID to be a number. Attempted to parse: ${sourceBranch.replace('refs/pull/', '')}`);
        tl.setResult(tl.TaskResult.Failed, "Could not retrieve pull request ID from the server.");
        process.exit(1);
    }

    return pullRequestId;
}

function getBearerToken() {

    tl.debug('Getting the agent bearer token');

    // Get authentication from the agent itself
    var auth = tl.getEndpointAuthorization('SYSTEMVSSCONNECTION', false);
    if (auth.scheme !== 'OAuth') {
        // Looks like: "Could not get an authentication token from the build agent."
        console.log("Could not get an authentication token from the build agent.");
    }

    return auth.parameters['AccessToken'];
}

run();