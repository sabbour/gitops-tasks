"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const tl = require("vsts-task-lib/task");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            var buildReason = tl.getInput("buildReason", true);
            var sourceBranchName = tl.getInput("sourceBranchName", true);
            var gitCommitId = tl.getInput("gitCommitId", true);
            var buildId = tl.getInput("buildId", true);
            var prNumber = tl.getInput("prNumber", (buildReason == "PullRequest")); // required if build reason is PR
            var buildTag = "";
            // Shorten the commit id
            var shortCommitId = gitCommitId;
            if (gitCommitId.length > 7)
                shortCommitId = gitCommitId.substring(0, 7);
            // If it is a pull request
            if (buildReason == "PullRequest" && prNumber != null) {
                buildTag = sourceBranchName + "-pr-" + prNumber + "-" + shortCommitId + "-" + buildId;
            }
            else {
                buildTag = sourceBranchName + "-" + shortCommitId + "-" + buildId;
            }
            // Set it
            console.log("##vso[build.updatebuildnumber]" + buildTag.toLowerCase());
        }
        catch (err) {
            tl.setResult(tl.TaskResult.Failed, err.message);
        }
    });
}
run();
//# sourceMappingURL=index.js.map