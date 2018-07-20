import * as tl from "vsts-task-lib/task";
import * as gitInterfaces from "vso-node-api/interfaces/GitInterfaces";
import * as git from "vso-node-api/GitApi";
import * as web from "vso-node-api/WebApi";

export async function generateBuildNumber(
  buildReason: string,
  buildId: string,
  sourceBranchName: string,
  pullRequestNumber?: string
): Promise<string> {
  var buildTag = "";

  // If it is a pull request
  if (buildReason == "PullRequest" && pullRequestNumber != null) {
    buildTag = "pr-" + pullRequestNumber + "-" + buildId;
  } else {
    buildTag = sourceBranchName + "-" + buildId;
  }

  return Promise.resolve(buildTag);
}

export async function generateNamespace(
  serviceName: string,
  environment: string,
  number: string
): Promise<string> {
  var namespace = "";
  var numberProvided =
    number != undefined && number != null && number.trim() != "";
  var environmentProvided =
    environment != undefined && environment != null && environment.trim() != "";

  if (numberProvided && environmentProvided)
    namespace = serviceName + "-" + environment + "-" + number;
  // testservice-pr-1
  else if (!numberProvided && environmentProvided)
    namespace = serviceName + "-" + environment;
  // testservice-dev
  else namespace = serviceName; // testservice

  return Promise.resolve(namespace);
}

export function setVariable(name: string, value: string) {
  console.log("##vso[" + name + "]" + value);
}

export function stopOnNonPrBuild() {
  tl.debug("Checking if this is a PR build");
  var sourceBranch: string = tl.getVariable("Build.SourceBranch");
  if (sourceBranch != undefined && !sourceBranch.startsWith("refs/pull/")) {
    // ="Skipping pull request commenting - this build was not triggered by a pull request."
    console.log("Not triggered by a Pull Request, skipping.");
    process.exit();
  }
}

export function getPullRequestId(): string {
  var prNumber: string;

  // Try to get from the system variables (VSTS Git)
  prNumber = tl.getVariable("System.PullRequest.PullRequestId");

  // Try to get from the system variables (GitHub)
  if (prNumber == undefined)
    prNumber = tl.getVariable("System.PullRequest.PullRequestNumber");

  // Try to parse it from the full branch name, ex: refs/pull/1
  if (prNumber == undefined) {
    let sourceBranch: string = tl.getVariable("Build.SourceBranch");
    if (sourceBranch != undefined) {
      var pullRequestId: number = Number.parseInt(
        sourceBranch.replace("refs/pull/", "")
      );
      if (!isNaN(pullRequestId)) prNumber = pullRequestId.toString();
    }
  }
  return prNumber;
}

export async function getPullRequestIdByCommitIdAsync(
  commitId: string
): Promise<string> {
  var prNumber: string;
  var gitClient: git.IGitApi;
  var accountUri: string = tl.getVariable("System.TeamFoundationCollectionUri");
  var accessToken = getBearerToken();
  var repoId = tl.getVariable("Build.Repository.Id");
  var creds = web.getBearerHandler(accessToken);
  var connection = new web.WebApi(accountUri, creds);
  gitClient = connection.getGitApi();

  let queryInput = {
    items: [commitId],
    type: gitInterfaces.GitPullRequestQueryType.LastMergeCommit
  } as gitInterfaces.GitPullRequestQueryInput;

  let queries = {
    queries: [queryInput]
  } as gitInterfaces.GitPullRequestQuery;

  var queryResult = await gitClient.getPullRequestQuery(queries, repoId);
  var qs = queryResult.results;
  prNumber = qs[0].pullRequestId.toString();
  return Promise.resolve(prNumber);
}

export function getBearerToken() {
  tl.debug("Getting the agent bearer token");

  var auth = tl.getEndpointAuthorization("SYSTEMVSSCONNECTION", false);
  if (auth.scheme !== "OAuth") {
    // Looks like: "Could not get an authentication token from the build agent."
    console.log("Could not get an authentication token from the build agent.");
  }
  return auth.parameters["AccessToken"];
}
