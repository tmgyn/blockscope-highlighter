import * as vscode from "vscode";
import { CommentParser } from "./commentParser";

let textEditorDecoration: vscode.TextEditorDecorationType;

export interface Bracket {
  start: string;
  end: string;
}

export interface RGBA {
  red: number;
  green: number;
  blue: number;
  alpha: number;
}

export class BracketParser {
  private activeEditor: vscode.TextEditor;
  private commentParser: CommentParser;

  private bracket: Bracket;
  private rgba: RGBA;

  public constructor(
    activeEditor: vscode.TextEditor,
    commentParser: CommentParser,
    bracket: Bracket,
    rgba: RGBA
  ) {
    this.activeEditor = activeEditor;
    this.commentParser = commentParser;
    this.bracket = bracket;
    this.rgba = rgba;
  }

  update(): void {
    let pos = this.activeEditor.selection.active;
    var offsetPos = this.activeEditor.document.offsetAt(pos);

    var range;
    let returnType = this.lookBackwardForBracket(offsetPos - 1);
    if (returnType.scope > 0) {
      range = this.getRange(
        returnType.pos,
        this.lookForwardForEndBracket(returnType.pos + 1).pos
      );
    } else {
      let returnType2 = this.lookForwardForBracket(returnType.pos + 1);
      if (returnType2.scope > 0) {
        range = this.getRange(
          this.lookBackwardForStartBracket(returnType2.pos - 1).pos,
          this.lookForwardForEndBracket(returnType.pos + 1)?.pos
        );
      } else {
        range = this.getRange(
          this.lookBackwardForStartBracket(returnType2.pos - 1).pos,
          returnType2.pos
        );
      }
    }

    if (range) {
      this.render(range);
    }
  }

  private lookBackwardForBracket(pos: number): { pos: number; scope: number } {
    let text = this.activeEditor.document.getText();

    while (pos < text.length && pos >= 0) {
      pos = this.commentParser.getNextStartOffset(pos);

      if (text[pos] === this.bracket.start) {
        return { pos, scope: 1 };
      }
      if (text[pos] === this.bracket.end) {
        return { pos, scope: -1 };
      }
      pos--;
    }
    this.finally();
  }

  private lookForwardForBracket(pos: number): { pos: number; scope: number } {
    let text = this.activeEditor.document.getText();

    while (pos < text.length && pos >= 0) {
      pos = this.commentParser.getNextEndOffset(pos);

      if (text[pos] === this.bracket.start) {
        return { pos, scope: 1 };
      }
      if (text[pos] === this.bracket.end) {
        return { pos, scope: -1 };
      }
      pos++;
    }
    this.finally();
  }

  private lookForwardForEndBracket(
    pos: number
  ): { pos: number; scope: number } {
    let text = this.activeEditor.document.getText();

    var scope = 0;
    while (pos < text.length && pos >= 0) {
      pos = this.commentParser.getNextEndOffset(pos);

      if (text[pos] === this.bracket.start) {
        scope++;
      }
      if (text[pos] === this.bracket.end) {
        if (scope-- === 0) {
          return { pos, scope: 0 };
        }
      }
      pos++;
    }
    this.finally();
  }

  private lookBackwardForStartBracket(
    pos: number
  ): { pos: number; scope: number } {
    let text = this.activeEditor.document.getText();

    var scope = 0;
    while (pos < text.length && pos >= 0) {
      pos = this.commentParser.getNextStartOffset(pos);

      if (text[pos] === this.bracket.start) {
        if (scope++ === 0) {
          return { pos, scope: 0 };
        }
      }
      if (text[pos] === this.bracket.end) {
        scope--;
      }
      pos--;
    }
    this.finally();
  }

  render(range: vscode.Range) {
    if (textEditorDecoration) {
      textEditorDecoration.dispose();
    }

    textEditorDecoration = vscode.window.createTextEditorDecorationType(<
      vscode.DecorationRenderOptions
    >{
      backgroundColor: this.getRGBA(
        this.rgba.red,
        this.rgba.green,
        this.rgba.blue,
        this.rgba.alpha
      ),
      isWholeLine: true,
    });

    this.activeEditor.setDecorations(textEditorDecoration, [range]);
  }

  finally(): never {
    if (textEditorDecoration) {
      textEditorDecoration.dispose();
    }
    throw console.error();
  }

  private getRange(start: number, end: number): vscode.Range | undefined {
    let pos1 = this.activeEditor.document.positionAt(start);
    let pos2 = this.activeEditor.document.positionAt(end);
    return new vscode.Range(pos1, pos2);
  }

  private getRGBA(
    red: number,
    green: number,
    blue: number,
    alpha: number
  ): string {
    return "rgba(" + red + "," + green + "," + blue + "," + alpha + ")";
  }
}
