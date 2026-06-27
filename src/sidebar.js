const vscode = require("vscode");
const { LESSONS } = require("./lessons");

class LessonItem extends vscode.TreeItem {
  constructor(lesson, isCompleted, isLocked) {
    const icon = isCompleted ? "✅" : isLocked ? "🔒" : "📖";
    super(`${icon} ${lesson.title}`, vscode.TreeItemCollapsibleState.None);
    this.lesson = lesson;
    this.isCompleted = isCompleted;
    this.isLocked = isLocked;
    this.description = `+${lesson.xp} XP`;
    this.tooltip = isLocked
      ? "Complete previous lessons to unlock"
      : `${lesson.title} — ${lesson.xp} XP`;
    this.contextValue = isLocked ? "lockedLesson" : "lesson";

    if (!isLocked) {
      this.command = {
        command: "vimquest.openLesson",
        title: "Open Lesson",
        arguments: [lesson.id],
      };
    }
  }
}

class ChapterItem extends vscode.TreeItem {
  constructor(chapterName, lessons, completedIds) {
    const completed = lessons.filter((l) => completedIds.includes(l.id)).length;
    const total = lessons.length;
    super(chapterName, vscode.TreeItemCollapsibleState.Expanded);
    this.description = `${completed}/${total}`;
    this.contextValue = "chapter";
    this._lessons = lessons;
  }
}

class LessonsProvider {
  constructor(context) {
    this._context = context;
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getCompletedIds() {
    return this._context.globalState.get("vimquest.completed", []);
  }

  getTreeItem(element) {
    return element;
  }

  getChildren(element) {
    const completed = this.getCompletedIds();

    if (!element) {
      // Return chapters
      const chapters = [...new Set(LESSONS.map((l) => l.chapter))];
      return chapters.map((ch) => {
        const chLessons = LESSONS.filter((l) => l.chapter === ch);
        return new ChapterItem(ch, chLessons, completed);
      });
    }

    if (element instanceof ChapterItem) {
      const allLessons = LESSONS;
      return element._lessons.map((lesson, idx) => {
        const globalIdx = allLessons.indexOf(lesson);
        const isCompleted = completed.includes(lesson.id);
        // First lesson of first chapter always unlocked; otherwise need previous done
        const isLocked =
          globalIdx > 0 && !completed.includes(allLessons[globalIdx - 1].id);
        return new LessonItem(lesson, isCompleted, isLocked);
      });
    }

    return [];
  }
}

class ProgressItem extends vscode.TreeItem {
  constructor(label, description, icon) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.description = description;
    this.iconPath = new vscode.ThemeIcon(icon);
  }
}

class ProgressProvider {
  constructor(context) {
    this._context = context;
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element) {
    return element;
  }

  getChildren() {
    const completed = this._context.globalState.get("vimquest.completed", []);
    const totalXP = LESSONS.filter((l) => completed.includes(l.id)).reduce(
      (sum, l) => sum + l.xp,
      0
    );
    const totalLessons = LESSONS.length;
    const completedCount = completed.length;
    const rank = getRank(totalXP);

    return [
      new ProgressItem("🏅 Rank", rank, "star"),
      new ProgressItem(
        "⚡ Total XP",
        `${totalXP} XP`,
        "zap"
      ),
      new ProgressItem(
        "📚 Lessons",
        `${completedCount} / ${totalLessons}`,
        "book"
      ),
      new ProgressItem(
        "🔥 Streak",
        `${this._context.globalState.get("vimquest.streak", 0)} days`,
        "flame"
      ),
    ];
  }
}

function getRank(xp) {
  if (xp === 0) return "🐣 Vim Newbie";
  if (xp < 200) return "🗡️ Vim Apprentice";
  if (xp < 500) return "⚔️ Vim Warrior";
  if (xp < 1000) return "🏹 Vim Ranger";
  if (xp < 1800) return "🧙 Vim Mage";
  return "🏆 Vim Master";
}

module.exports = { LessonsProvider, ProgressProvider, getRank };
