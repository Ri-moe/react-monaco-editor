import * as React from "react";
import * as monacoEditor from "monaco-editor/esm/vs/editor/editor.api";

export type ChangeHandler = (
  value: string,
  event: monacoEditor.editor.IModelContentChangedEvent
) => void;

export type EditorDidMount = (
  editor: monacoEditor.editor.IStandaloneCodeEditor,
  monaco: typeof monacoEditor
) => void;

/**
 * @remarks
 * This will be `IStandaloneEditorConstructionOptions` in newer versions of monaco-editor, or
 * `IEditorConstructionOptions` in versions before that was introduced.
 */
export type EditorConstructionOptions = NonNullable<
  Parameters<typeof monacoEditor.editor.create>[1]
>;

export type EditorWillMount = (
  monaco: typeof monacoEditor
) => void | EditorConstructionOptions;

export type InitErrorHandler = (
  error: object,
  handler: {
    times: number,
    retry: () => void,
    setFailing: (
      isFailing: boolean
    ) => void
  }
) => void;

export interface MonacoEditorBaseProps {
  /**
   * Width of editor. Defaults to 100%.
   */
  width?: string | number;

  /**
   * Height of editor. Defaults to 500.
   */
  height?: string | number;

  /**
   * The loading screen before the editor will be loaded. Defaults to 'Loading...'.
   */
  loading?: React.ReactNode | string;

  /**
   * The screen when loading failed. Defaults to 'Load failed.'.
   */
  failing?: React.ReactNode | string;

  /**
   * The initial value of the auto created model in the editor.
   */
  defaultValue?: string;

  /**
   * The initial language of the auto created model in the editor. Defaults to 'javascript'.
   */
  language?: string;

  /**
   * Theme to be used for rendering.
   * The current out-of-the-box available themes are: 'vs' (default), 'vs-dark', 'hc-black'.
   * You can create custom themes via `monaco.editor.defineTheme`.
   */
  theme?: string | null;

  /**
   * Class name for the editor container.
   */
  className?: string;

  /**
   * Class name for the editor container wrapper.
   */
  wrapperClassName?: string;

  /**
   * An event emitted when failing to load monaco.
   */
  onInitError?: InitErrorHandler;
}

export interface MonacoEditorProps extends MonacoEditorBaseProps {
  /**
   * Value of the auto created model in the editor.
   * If you specify `null` or `undefined` for this property, the component behaves in uncontrolled mode.
   * Otherwise, it behaves in controlled mode.
   */
  value?: string | null;

  /**
   * Refer to Monaco interface {monaco.editor.IStandaloneEditorConstructionOptions}.
   */
  options?: monacoEditor.editor.IStandaloneEditorConstructionOptions;

  /**
   * Refer to Monaco interface {monaco.editor.IEditorOverrideServices}.
   */
  overrideServices?: monacoEditor.editor.IEditorOverrideServices;

  /**
   * An event emitted when the editor has been mounted (similar to componentDidMount of React).
   */
  editorDidMount?: EditorDidMount;

  /**
   * An event emitted before the editor mounted (similar to componentWillMount of React).
   */
  editorWillMount?: EditorWillMount;

  /**
   * An event emitted when the content of the current model has changed.
   */
  onChange?: ChangeHandler;
}

declare const MonacoEditor: React.Component<MonacoEditorProps>;

export default MonacoEditor;

export type Monaco = typeof monacoEditor;

declare namespace monacoLoader {
  function init(): Promise<Monaco>;
  function config(params: {
    paths?: {
      vs?: string,
    },
    'vs/nls'?: {
      availableLanguages?: object,
    },
  }): void
}

export { monacoLoader, MonacoEditor };
