const vscode = require("vscode");
const { LessonsProvider, ProgressProvider } = require("./sidebar");
const { getLessonPanel } = require("./lessonPanel");
const { getGamePanel } = require("./gamePanel");
const { getWelcomePanel } = require("./welcomePanel");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // ─── PROVIDERS ──────────────────────────────────────────────────────────
  const lessonsProvider = new LessonsProvider(context);
  const progressProvider = new ProgressProvider(context);

  const providers = {
    lessons: lessonsProvider,
    progress: progressProvider,
  };

  // ─── TREE VIEWS ─────────────────────────────────────────────────────────
  vscode.window.createTreeView("vimquest.lessonsView", {
    treeDataProvider: lessonsProvider,
    showCollapseAll: false,
  });

  vscode.window.createTreeView("vimquest.progressView", {
    treeDataProvider: progressProvider,
    showCollapseAll: false,
  });

  // ─── COMMANDS ───────────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("vimquest.openLesson", (lessonId) => {
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
        "Reset all VimQuest progress?",
        "Yes, reset",
        "Cancel"
      );
      if (pick === "Yes, reset") {
        await context.globalState.update("vimquest.completed", []);
        await context.globalState.update("vimquest.streak", 0);
        await context.globalState.update("vimquest.lastDay", "");
        lessonsProvider.refresh();
        progressProvider.refresh();
        vscode.window.showInformationMessage("VimQuest: Progress reset!");
      }
    })
  );

  // ─── FIRST LAUNCH ───────────────────────────────────────────────────────
  const hasLaunched = context.globalState.get("vimquest.hasLaunched", false);
  if (!hasLaunched) {
    context.globalState.update("vimquest.hasLaunched", true);
    // Small delay so the sidebar loads first
    setTimeout(() => {
      getWelcomePanel(context, providers);
    }, 800);
  }
}

function deactivate() {}

module.exports = { activate, deactivate };
