import { useState, useRef, useEffect, useCallback } from "react";
import { useEditorStore } from "../../store/editor-store";
import {
  saveDocument,
  saveDocumentAs,
  openDocument,
  exportAns,
} from "../../infrastructure/tauri-file-io";
import { InputDialog, type InputDialogField } from "./InputDialog";
import "./MenuBar.css";

interface MenuItem {
  label: string;
  shortcut?: string;
  action: () => void;
  separator?: boolean;
}

interface DialogConfig {
  title: string;
  fields: InputDialogField[];
  onOk: (values: string[]) => void;
}

export function MenuBar() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogConfig | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const doc = useEditorStore((s) => s.document);

  // メニュー外クリックで閉じる
  useEffect(() => {
    if (!openMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openMenu]);

  // Ctrl+N ショートカットからのカスタムイベントを受信
  useEffect(() => {
    const handler = () => handleNew();
    window.addEventListener("beryldraw:new-document", handler);
    return () => window.removeEventListener("beryldraw:new-document", handler);
  });

  const handleNew = useCallback(() => {
    setOpenMenu(null);
    setDialog({
      title: "New Document",
      fields: [
        { label: "Width:", defaultValue: "40" },
        { label: "Height:", defaultValue: "25" },
      ],
      onOk: (values) => {
        const width = parseInt(values[0] ?? "") || 0;
        const height = parseInt(values[1] ?? "") || 0;
        if (width > 0 && height > 0) {
          useEditorStore.getState().newDocument(width, height);
        }
        setDialog(null);
      },
    });
  }, []);

  const handleOpen = useCallback(async () => {
    setOpenMenu(null);
    try {
      const result = await openDocument();
      if (result) {
        useEditorStore.getState().loadDocument(result.doc);
      }
    } catch (e) {
      console.error("Failed to open:", e);
    }
  }, []);

  const handleSave = useCallback(async () => {
    setOpenMenu(null);
    try {
      const state = useEditorStore.getState();
      const filePath = await saveDocument(state.document);
      if (filePath) {
        state.markSaved(filePath);
      }
    } catch (e) {
      console.error("Failed to save:", e);
    }
  }, []);

  const handleSaveAs = useCallback(async () => {
    setOpenMenu(null);
    try {
      const state = useEditorStore.getState();
      const filePath = await saveDocumentAs(state.document);
      if (filePath) {
        state.markSaved(filePath);
      }
    } catch (e) {
      console.error("Failed to save:", e);
    }
  }, []);

  const handleResize = useCallback(() => {
    setOpenMenu(null);
    const state = useEditorStore.getState();
    const curW = state.document.grid.width;
    const curH = state.document.grid.height;
    setDialog({
      title: "Resize Canvas",
      fields: [
        { label: "Width:", defaultValue: String(curW) },
        { label: "Height:", defaultValue: String(curH) },
      ],
      onOk: (values) => {
        const width = parseInt(values[0] ?? "") || 0;
        const height = parseInt(values[1] ?? "") || 0;
        if (width > 0 && height > 0 && (width !== curW || height !== curH)) {
          useEditorStore.getState().resizeCanvas(width, height);
        }
        setDialog(null);
      },
    });
  }, []);

  const handleExportAns = useCallback(async () => {
    setOpenMenu(null);
    try {
      await exportAns(useEditorStore.getState().document.grid);
    } catch (e) {
      console.error("Failed to export:", e);
    }
  }, []);

  const handleUndo = useCallback(() => {
    useEditorStore.getState().undo();
    setOpenMenu(null);
  }, []);

  const handleRedo = useCallback(() => {
    useEditorStore.getState().redo();
    setOpenMenu(null);
  }, []);

  const mod = navigator.platform.includes("Mac") ? "Cmd" : "Ctrl";

  const menus: Record<string, MenuItem[]> = {
    File: [
      { label: "New", shortcut: `${mod}+N`, action: handleNew },
      { label: "Open...", shortcut: `${mod}+O`, action: handleOpen },
      { label: "Save", shortcut: `${mod}+S`, action: handleSave },
      { label: "Save As...", action: handleSaveAs },
      {
        label: "Export ANS...",
        action: handleExportAns,
        separator: true,
      },
    ],
    Edit: [
      { label: "Undo", shortcut: `${mod}+Z`, action: handleUndo },
      { label: "Redo", shortcut: `${mod}+Shift+Z`, action: handleRedo },
      { label: "Resize Canvas...", action: handleResize, separator: true },
    ],
  };

  return (
    <>
      <div className="menubar" ref={menuRef}>
        <span className="menubar-title">
          BerylDraw - {doc.name}
          {doc.dirty ? " *" : ""}
        </span>
        <div className="menubar-items">
          {Object.entries(menus).map(([name, items]) => (
            <div key={name} className="menu-container">
              <button
                className={`menu-trigger ${openMenu === name ? "active" : ""}`}
                onClick={() =>
                  setOpenMenu(openMenu === name ? null : name)
                }
                onMouseEnter={() => {
                  if (openMenu && openMenu !== name) setOpenMenu(name);
                }}
              >
                {name}
              </button>
              {openMenu === name && (
                <div className="menu-dropdown">
                  {items.map((item, i) => (
                    <div key={i}>
                      {item.separator && <div className="menu-separator" />}
                      <button
                        className="menu-item"
                        onClick={item.action}
                      >
                        <span>{item.label}</span>
                        {item.shortcut && (
                          <span className="menu-shortcut">
                            {item.shortcut}
                          </span>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {dialog && (
        <InputDialog
          title={dialog.title}
          fields={dialog.fields}
          onOk={dialog.onOk}
          onCancel={() => setDialog(null)}
        />
      )}
    </>
  );
}
