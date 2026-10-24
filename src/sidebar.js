const vscode = require("vscode");
const { LESSONS } = require("./lessons");
const progressMutationQueueKey = Symbol.for("vimquest.progressMutationQueue");
const progressMutationQueue = globalThis[progressMutationQueueKey] || { tail: Promise.resolve() };
globalThis[progressMutationQueueKey] = progressMutationQueue;

function withProgressMutation(operation) {
  const mutation = progressMutationQueue.tail.then(operation);
  progressMutationQueue.tail = mutation.catch(() => {});
  return mutation;
}

class LessonItem extends vscode.TreeItem {
  constructor(lesson, isCompleted, isLocked) {
    super(lesson.title, vscode.TreeItemCollapsibleState.None);
    this.lessonId = lesson.id;        // store id directly
    this.lessonXP  = lesson.xp;
    this.isCompleted = isCompleted;
    this.isLocked    = isLocked;

    // Status icons via ThemeIcon
    if (isCompleted) {
      this.iconPath = new vscode.ThemeIcon("pass-filled", new vscode.ThemeColor("charts.green"));
    } else if (isLocked) {
      this.iconPath = new vscode.ThemeIcon("lock");
    } else {
      this.iconPath = new vscode.ThemeIcon("book");
    }

    this.description = `+${lesson.xp} XP`;
    this.tooltip     = isLocked
      ? "Complete previous lessons to unlock"
      : `${lesson.title} — ${lesson.xp} XP`;
    this.contextValue = isLocked ? "lockedLesson" : "lesson";

    // THE FIX: pass lessonId as argument so the command receives it
    if (!isLocked) {
      this.command = {
        command: "vimquest.openLesson",
        title: "Open Lesson",
        arguments: [lesson.id],   // ← string ID, not the tree item
      };
    }
  }
}

class ChapterItem extends vscode.TreeItem {
  constructor(chapterName, lessons, completedIds) {
    const done  = lessons.filter((l) => completedIds.includes(l.id)).length;
    const total = lessons.length;
    // Strip the emoji from display name so it renders cleanly as label
    super(chapterName, vscode.TreeItemCollapsibleState.Expanded);
    this.description  = `${done}/${total}`;
    this.contextValue = "chapter";
    this._lessons     = lessons;

    // chapter icon
    const allDone = done === total && total > 0;
    this.iconPath = allDone
      ? new vscode.ThemeIcon("star-full", new vscode.ThemeColor("charts.yellow"))
      : new vscode.ThemeIcon("folder");
  }
}

class LessonsProvider {
  constructor(context) {
    this._context = context;
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData  = this._onDidChangeTreeData.event;
  }

  refresh() { this._onDidChangeTreeData.fire(); }

  getCompletedIds() {
    return this._context.globalState.get("vimquest.completed", []);
  }

  getTreeItem(element) { return element; }

  getChildren(element) {
    const completed = this.getCompletedIds();

    if (!element) {
      const chapters = [...new Set(LESSONS.map((l) => l.chapter))];
      return chapters.map((ch) => {
        const chLessons = LESSONS.filter((l) => l.chapter === ch);
        return new ChapterItem(ch, chLessons, completed);
      });
    }

    if (element instanceof ChapterItem) {
      return element._lessons.map((lesson) => {
        const globalIdx  = LESSONS.indexOf(lesson);
        const isCompleted = completed.includes(lesson.id);
        const isLocked    = globalIdx > 0 && !completed.includes(LESSONS[globalIdx - 1].id);
        return new LessonItem(lesson, isCompleted, isLocked);
      });
    }

    return [];
  }
}

// ─── PROGRESS VIEW ───────────────────────────────────────────────────────────

class ProgressItem extends vscode.TreeItem {
  constructor(label, description, iconId) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.description = description;
    this.iconPath    = new vscode.ThemeIcon(iconId);
  }
}

class ProgressProvider {
  constructor(context) {
    this._context = context;
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData  = this._onDidChangeTreeData.event;
  }

  refresh() { this._onDidChangeTreeData.fire(); }
  getTreeItem(element) { return element; }

  getChildren() {
    const completed     = this._context.globalState.get("vimquest.completed", []);
    const totalXP       = getTotalXP(this._context);
    const completedCount = completed.length;
    const totalLessons  = LESSONS.length;
    const rank          = getRank(totalXP);
    const streak        = this._context.globalState.get("vimquest.streak", 0);

    return [
      new ProgressItem("Rank",    rank,                         "star"),
      new ProgressItem("XP",      `${totalXP} XP`,             "zap"),
      new ProgressItem("Lessons", `${completedCount} / ${totalLessons}`, "book"),
      new ProgressItem("Streak",  `${streak} days`,            "flame"),
    ];
  }
}

function getRank(xp) {
  if (xp === 0)    return "🐣 Vim Newbie";
  if (xp < 200)   return "🗡️ Apprentice";
  if (xp < 500)   return "⚔️ Warrior";
  if (xp < 1000)  return "🏹 Ranger";
  if (xp < 1800)  return "🧙 Mage";
  return "🏆 Vim Master";
}

function getTotalXP(context) {
  const completed = context.globalState.get("vimquest.completed", []);
  const lessonXP = Array.isArray(completed)
    ? LESSONS.filter((lesson) => completed.includes(lesson.id)).reduce((sum, lesson) => sum + lesson.xp, 0)
    : 0;
  const dailyXP = context.globalState.get("vimquest.dailyXP", 0);
  const validatedDailyXP = Number.isSafeInteger(dailyXP) && dailyXP >= 0 ? dailyXP : 0;
  if (validatedDailyXP > Number.MAX_SAFE_INTEGER - lessonXP) return Number.MAX_SAFE_INTEGER;
  return lessonXP + validatedDailyXP;
}

async function resetProgress(context, providers = {}, refreshWelcomePanel) {
  await withProgressMutation(async () => {
    let snapshots = new Map();
    const attemptedKeys = [];

    try {
      const games = require("./games");
      const resetEntries = [
        ["vimquest.completed", []],
        ["vimquest.streak", 0],
        ["vimquest.lastDay", ""],
        ["vimquest.dailyXP", 0],
        ["vimquest.dailyCompleted", ""],
        ...games.map((game) => [`vimquest.best.${game.id}`, 0])
      ];
      snapshots = new Map(resetEntries.map(([key]) => [key, context.globalState.get(key)]));
      for (const [key, value] of resetEntries) {
        attemptedKeys.push(key);
        await context.globalState.update(key, value);
      }
    } catch (error) {
      let rollbackFailed = false;
      for (const key of attemptedKeys.reverse()) {
        try {
          await context.globalState.update(key, snapshots.get(key));
        } catch (_) {
          rollbackFailed = true;
        }
      }
      if (vscode.window && typeof vscode.window.showErrorMessage === "function") {
        try {
          await vscode.window.showErrorMessage(rollbackFailed
            ? "VimQuest: Progress reset failed. Your progress may be partially reset."
            : "VimQuest: Progress reset failed. Please try again.");
        } catch (_) { /* Preserve the original persistence error. */ }
      }
      throw error;
    }
  });

  if (providers.lessons) providers.lessons.refresh();
  if (providers.progress) providers.progress.refresh();
  const dailyPath = require.resolve("./panels/daily");
  if (require.cache[dailyPath]) require.cache[dailyPath].exports.refreshDailyPanel();
  if (refreshWelcomePanel) refreshWelcomePanel(context);
}

module.exports = { LessonsProvider, ProgressProvider, getRank, getTotalXP, resetProgress, withProgressMutation };
