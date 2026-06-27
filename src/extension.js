const vscode = require("vscode");
const { LessonsProvider, ProgressProvider } = require("./sidebar");
const { getLessonPanel } = require("./lessonPanel");
const { getGamePanel }   = require("./gamePanel");
const { getWelcomePanel } = require("./welcomePanel");

/** @param {vscode.ExtensionContext} context */
function activate(context) {
  const lessonsProvider  = new LessonsProvider(context);
  const progressProvider = new ProgressProvider(context);
  const providers = { lessons: lessonsProvider, progress: progressProvider };

  // ── Tree Views ──────────────────────────────────────────────────────────
  vscode.window.createTreeView("vimquest.lessonsView", {
    treeDataProvider: lessonsProvider,
    showCollapseAll: false,
  });
  vscode.window.createTreeView("vimquest.progressView", {
    treeDataProvider: progressProvider,
    showCollapseAll: false,
  });

  // ── Commands ────────────────────────────────────────────────────────────
  context.subscriptions.push(

    // openLesson — called from sidebar (.command on tree item passes lesson id as argument)
    // arg is either a string lessonId (from tree item command) or a LessonItem object
    vscode.commands.registerCommand("vimquest.openLesson", (arg) => {
      let lessonId;
      if (typeof arg === "string") {
        // called directly, e.g. vimquest.openLesson('l1')
        lessonId = arg;
      } else if (arg && typeof arg === "object" && arg.lessonId) {
        // VS Code sometimes passes the tree item itself
        lessonId = arg.lessonId;
      } else if (arg && typeof arg === "object" && arg.id) {
        lessonId = arg.id;
      }

      if (!lessonId) {
        vscode.window.showErrorMessage("VimQuest: Could not determine which lesson to open.");
        return;
      }
      getLessonPanel(context, lessonId, providers);
    }),

    vscode.commands.registerCommand("vimquest.openGame", () => {
      getGamePanel(context, providers);
    }),

    vscode.commands.registerCommand("vimquest.showWelcome", () => {
      getWelcomePanel(context, providers);
    }),

    vscode.commands.registerCommand("vimquest.resetProgress", async () => {
      const pick = await vscode.window.showWarningMessage(
        "Reset all VimQuest progress? This cannot be undone.",
        "Yes, reset",
        "Cancel"
      );
      if (pick === "Yes, reset") {
        await context.globalState.update("vimquest.completed", []);
        await context.globalState.update("vimquest.streak", 0);
        await context.globalState.update("vimquest.lastDay", "");
        lessonsProvider.refresh();
        progressProvider.refresh();
        vscode.window.showInformationMessage("VimQuest: Progress reset successfully!");
      }
    })
  );

  // ── First launch: show welcome dashboard ───────────────────────────────
  const hasLaunched = context.globalState.get("vimquest.hasLaunched", false);
  if (!hasLaunched) {
    context.globalState.update("vimquest.hasLaunched", true);
    setTimeout(() => getWelcomePanel(context, providers), 800);
  }
}

function deactivate() {}
module.exports = { activate, deactivate };
