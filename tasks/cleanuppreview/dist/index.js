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
const tl = require("vsts-task-lib/task");
const gitops = __importStar(require("common-gitops"));
var prNumber;
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        // If not running on a Pull Request, stop
        gitops.stopOnNonPrBuild();
        try {
            var commitId = tl.getVariable('Build.SourceVersion');
            console.log("commitId: " + commitId);
            prNumber = yield gitops.getPullRequestIdByCommitIdAsync(commitId);
            console.log("prNumber: " + prNumber);
        }
        catch (err) {
            tl.setResult(tl.TaskResult.Failed, err.message);
        }
    });
}
function sleep(ms = 0) {
    return new Promise(r => setTimeout(r, ms));
}
run();
//# sourceMappingURL=index.js.map