"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const tl = __importStar(require("vsts-task-lib/task"));
const gitInterfaces = __importStar(require("vso-node-api/interfaces/GitInterfaces"));
const web = __importStar(require("vso-node-api/WebApi"));
function generateBuildNumber(buildReason, buildId, sourceBranchName, pullRequestNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        var buildTag = "";
        // If it is a pull request
        if (buildReason == "PullRequest" && pullRequestNumber != null) {
            buildTag = "pr-" + pullRequestNumber + "-" + buildId;
        }
        else {
            buildTag = sourceBranchName + "-" + buildId;
        }
        return Promise.resolve(buildTag);
    });
}
exports.generateBuildNumber = generateBuildNumber;
function generateNamespace(serviceName, environment, number) {
    return __awaiter(this, void 0, void 0, function* () {
        var namespace = "";
        var numberProvided = number != undefined && number != null && number.trim() != "";
        var environmentProvided = environment != undefined && environment != null && environment.trim() != "";
        if (numberProvided && environmentProvided)
            namespace = serviceName + "-" + environment + "-" + number;
        // testservice-pr-1
        else if (!numberProvided && environmentProvided)
            namespace = serviceName + "-" + environment;
        // testservice-dev
        else
            namespace = serviceName; // testservice
        return Promise.resolve(namespace);
    });
}
exports.generateNamespace = generateNamespace;
function setVariable(name, value) {
    console.log("##vso[" + name + "]" + value);
}
exports.setVariable = setVariable;
function stopOnNonPrBuild() {
    tl.debug("Checking if this is a PR build");
    var sourceBranch = tl.getVariable("Build.SourceBranch");
    if (sourceBranch != undefined && !sourceBranch.startsWith("refs/pull/")) {
        // ="Skipping pull request commenting - this build was not triggered by a pull request."
        console.log("Not triggered by a Pull Request, skipping.");
        process.exit();
    }
}
exports.stopOnNonPrBuild = stopOnNonPrBuild;
function getPullRequestId() {
    var prNumber;
    // Try to get from the system variables (VSTS Git)
    prNumber = tl.getVariable("System.PullRequest.PullRequestId");
    // Try to get from the system variables (GitHub)
    if (prNumber == undefined)
        prNumber = tl.getVariable("System.PullRequest.PullRequestNumber");
    // Try to parse it from the full branch name, ex: refs/pull/1
    if (prNumber == undefined) {
        let sourceBranch = tl.getVariable("Build.SourceBranch");
        if (sourceBranch != undefined) {
            var pullRequestId = Number.parseInt(sourceBranch.replace("refs/pull/", ""));
            if (!isNaN(pullRequestId))
                prNumber = pullRequestId.toString();
        }
    }
    return prNumber;
}
exports.getPullRequestId = getPullRequestId;
function getPullRequestIdByCommitIdAsync(commitId) {
    return __awaiter(this, void 0, void 0, function* () {
        var prNumber;
        var gitClient;
        var accountUri = tl.getVariable("System.TeamFoundationCollectionUri");
        var accessToken = getBearerToken();
        var repoId = tl.getVariable("Build.Repository.Id");
        var creds = web.getBearerHandler(accessToken);
        var connection = new web.WebApi(accountUri, creds);
        gitClient = connection.getGitApi();
        let queryInput = {
            items: [commitId],
            type: gitInterfaces.GitPullRequestQueryType.LastMergeCommit
        };
        let queries = {
            queries: [queryInput]
        };
        var queryResult = yield gitClient.getPullRequestQuery(queries, repoId);
        var qs = queryResult.results;
        prNumber = qs[0].pullRequestId.toString();
        return Promise.resolve(prNumber);
    });
}
exports.getPullRequestIdByCommitIdAsync = getPullRequestIdByCommitIdAsync;
function getBearerToken() {
    tl.debug('Getting the agent bearer token');
    // Get authentication from the agent itself
    try {
        var auth = tl.getEndpointAuthorization('SYSTEMVSSCONNECTION', false);
        if (auth.scheme !== 'OAuth') {
            // Looks like: "Could not get an authentication token from the build agent."
            console.log("Could not get an authentication token from the build agent.");
        }
        return auth.parameters['AccessToken'];
    }
    catch (err) {
        // Try using 'AccessToken' env variable
        console.log("Trying to get from AccessToken environment variable");
        var accessToken = tl.getVariable("AccessToken");
        return accessToken;
    }
}
exports.getBearerToken = getBearerToken;
//# sourceMappingURL=index.js.map