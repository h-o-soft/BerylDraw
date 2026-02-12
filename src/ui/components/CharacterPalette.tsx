import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useEditorStore } from "../../store/editor-store";
import { normalizeToFullWidth } from "../../domain/char-mapping";
import "./CharacterPalette.css";

/** よく使う文字のプリセットグループ */
const CHAR_GROUPS = [
  {
    name: "ASCII",
    chars: " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~",
  },
  {
    name: "Kana",
    chars: "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ",
  },
  {
    name: "Katakana",
    chars: "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポ",
  },
  {
    name: "Symbols",
    chars: "　、。・ー「」『』【】〈〉《》〔〕○●◎△▲▽▼□■◇◆☆★※→←↑↓〒〜…─│┌┐└┘├┤┬┴┼━┃┏┓┗┛┣┫┳┻╋",
  },
  {
    name: "Lines",
    chars: "─│┌┐└┘├┤┬┴┼━┃┏┓┗┛┣┫┳┻╋╔╗╚╝╠╣╦╩╬",
  },
];

export function CharacterPalette() {
  const currentChar = useEditorStore((s) => s.currentChar);
  const setCurrentChar = useEditorStore((s) => s.setCurrentChar);
  const [activeGroup, setActiveGroup] = useState(0);
  const [customInput, setCustomInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const group = CHAR_GROUPS[activeGroup]!;

  const charList = useMemo(() => {
    const result: number[] = [];
    for (const ch of group.chars) {
      const cp = ch.codePointAt(0);
      if (cp !== undefined) {
        result.push(normalizeToFullWidth(cp));
      }
    }
    return result;
  }, [group]);

  const handleCharClick = useCallback(
    (cp: number) => {
      setCurrentChar(cp);
    },
    [setCurrentChar],
  );

  const handleCustomInput = useCallback(() => {
    if (customInput.length > 0) {
      const cp = customInput.codePointAt(0);
      if (cp !== undefined) {
        setCurrentChar(normalizeToFullWidth(cp));
      }
      setCustomInput("");
    }
  }, [customInput, setCurrentChar]);

  // Enterキーでカスタム入力を確定
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        handleCustomInput();
      }
    };
    input.addEventListener("keydown", handler);
    return () => input.removeEventListener("keydown", handler);
  }, [handleCustomInput]);

  return (
    <div className="char-palette">
      <div className="char-palette-tabs">
        {CHAR_GROUPS.map((g, i) => (
          <button
            key={g.name}
            className={`char-tab ${activeGroup === i ? "active" : ""}`}
            onClick={() => setActiveGroup(i)}
          >
            {g.name}
          </button>
        ))}
      </div>
      <div className="char-grid">
        {charList.map((cp, i) => (
          <button
            key={i}
            className={`char-cell ${currentChar === cp ? "selected" : ""}`}
            onClick={() => handleCharClick(cp)}
            title={`U+${cp.toString(16).toUpperCase().padStart(4, "0")}`}
          >
            {String.fromCodePoint(cp)}
          </button>
        ))}
      </div>
      <div className="char-input-row">
        <input
          ref={inputRef}
          type="text"
          className="char-custom-input"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder="Input"
          maxLength={2}
        />
        <button className="char-input-btn" onClick={handleCustomInput}>
          Set
        </button>
      </div>
      <div className="char-current">
        Current: {String.fromCodePoint(currentChar)} (U+
        {currentChar.toString(16).toUpperCase().padStart(4, "0")})
      </div>
    </div>
  );
}
