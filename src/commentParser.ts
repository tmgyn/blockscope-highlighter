import * as vscode from "vscode";

export interface CommentSyntax {
  languageId: string[];
  singleline: string;
  multilineStart: string | undefined;
  multilineEnd: string | undefined;
}

export class CommentParser {
  private activeEditor: vscode.TextEditor;
  private commentSyntax: CommentSyntax | undefined;
  private commentRanges: Array<vscode.Range>;

  public constructor(
    activeEditor: vscode.TextEditor,
    commentSyntax: CommentSyntax | undefined
  ) {
    this.activeEditor = activeEditor;
    this.commentSyntax = commentSyntax;
    this.commentRanges = new Array();
  }

  public update(): void {
    if (this.activeEditor) {
      let ranges: Array<vscode.Range> = new Array();
      ranges = this.findSinglelineComment(ranges);
      ranges = this.findMultilineComment(ranges);
      this.commentRanges = ranges;
    }
  }

  public getNextStartOffset(offset: number): number {
    let pos = this.activeEditor.document.positionAt(offset);
    for (var i = 0; i < this.commentRanges.length; i++) {
      if (this.commentRanges[i].contains(pos)) {
        return (
          this.activeEditor.document.offsetAt(this.commentRanges[i].start) - 1
        );
      }
    }
    return offset;
  }

  public getNextEndOffset(offset: number): number {
    let pos = this.activeEditor.document.positionAt(offset);
    for (var i = 0; i < this.commentRanges.length; i++) {
      if (this.commentRanges[i].contains(pos)) {
        return (
          this.activeEditor.document.offsetAt(this.commentRanges[i].end) + 1
        );
      }
    }
    return offset;
  }

  private findSinglelineComment(
    ranges: Array<vscode.Range>
  ): Array<vscode.Range> {
    if (!this.commentSyntax) {
      return new Array();
    }

    let text = this.activeEditor.document.getText();

    let pattern = "(";
    pattern += this.escapeRegExp(this.commentSyntax?.singleline);
    pattern += ")+( |\t)*?(.*)";

    let flags = "gm";

    let regExp = new RegExp(pattern, flags);

    return this.find(regExp, text, ranges);
  }

  private findMultilineComment(
    ranges: Array<vscode.Range>
  ): Array<vscode.Range> {
    if (!this.commentSyntax && !this.isMultilineCommentDefine()) {
      return new Array();
    }

    let text = this.activeEditor.document.getText();

    let pattern = "(";
    pattern += this.escapeRegExp(this.commentSyntax?.multilineStart);
    pattern += "[\\s]*?)+([\\s\\S]*?)(";
    pattern += this.escapeRegExp(this.commentSyntax?.multilineEnd);
    pattern += ")";

    let flags = "gm";

    let regExp = new RegExp(pattern, flags);

    return this.find(regExp, text, ranges);
  }

  private find(
    regExp: RegExp,
    text: string,
    ranges: Array<vscode.Range>
  ): Array<vscode.Range> {
    var match: any;
    while ((match = regExp.exec(text))) {
      let startPos = this.activeEditor.document.positionAt(match.index);
      let endPos = this.activeEditor.document.positionAt(
        match.index + match[0].length
      );
      let range = new vscode.Range(startPos, endPos);
      ranges.push(range);
    }
    return ranges;
  }

  private escapeRegExp(input: string | undefined): string | undefined {
    if (input) {
      return input.replace(/[.*+?^${}()|[\]\\\/"]/g, "\\$&");
    }
  }

  private isMultilineCommentDefine(): boolean | undefined {
    if (this.commentSyntax) {
      return (
        this.commentSyntax.multilineStart != null &&
        this.commentSyntax.multilineEnd != null
      );
    }
  }
}
