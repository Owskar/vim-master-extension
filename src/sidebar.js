const vscode = require("vscode");
const { LESSONS } = require("./lessons");

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
    const totalXP       = LESSONS.filter((l) => completed.includes(l.id)).reduce((s, l) => s + l.xp, 0);
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

module.exports = { LessonsProvider, ProgressProvider, getRank };
