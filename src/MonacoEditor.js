import PropTypes from "prop-types";
import React from "react";
import { monaco, noop } from "./utils";
import MonacoContainer from './MonacoContainer';

class MonacoEditor extends React.Component {
  static propTypes = {
    width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    loading: PropTypes.oneOfType([PropTypes.element, PropTypes.string]),
    failing: PropTypes.oneOfType([PropTypes.element, PropTypes.string]),
    value: PropTypes.string,
    defaultValue: PropTypes.string,
    language: PropTypes.string,
    theme: PropTypes.string,
    options: PropTypes.object,
    overrideServices: PropTypes.object,
    editorDidMount: PropTypes.func,
    editorWillMount: PropTypes.func,
    onChange: PropTypes.func,
    onInitError: PropTypes.func,
    className: PropTypes.string,
    wrapperClassName: PropTypes.string,
  };

  static defaultProps = {
    width: "100%",
    height: "100%",
    loading: 'Loading...',
    failing: 'Load failed.',
    value: null,
    defaultValue: "",
    language: "javascript",
    theme: null,
    options: {},
    overrideServices: {},
    editorDidMount: noop,
    editorWillMount: noop,
    onChange: noop,
    onInitError: (error, handler) => {
      console.error('Monaco initialization error:', error);
      if (handler.times <= 3) handler.retry();
      else handler.setFailing(true);
    },
  };

  constructor(props) {
    super(props);
    this.editor = undefined;
    this.monaco = undefined;
    this.cancelable = undefined;
    this.containerElement = undefined;
    this._subscription = undefined;
    this.__prevent_trigger_change_event = false;
    this.isMonacoMounting = true;
    this.errorHandler = {
      times: 0,
      retry: () => this.initMonaco(),
      setFailing: (isFailing) => this.setState({ isFailing }),
    };
    this.state = {
      isEditorReady: false,
      isFailing: false,
    };
  }

  componentDidMount() {
    this.initMonaco();
  }

  componentDidUpdate(prevProps) {
    if (this.isMonacoMounting || this.state.isFailing) return;

    const { value, language, theme, height, options, width } = this.props;

    const { editor, monaco } = this;
    const model = editor.getModel();

    if (this.props.value != null && this.props.value !== model.getValue()) {
      this.__prevent_trigger_change_event = true;
      this.editor.pushUndoStop();
      // pushEditOperations says it expects a cursorComputer, but doesn't seem to need one.
      model.pushEditOperations(
        [],
        [
          {
            range: model.getFullModelRange(),
            text: value,
          },
        ]
      );
      this.editor.pushUndoStop();
      this.__prevent_trigger_change_event = false;
    }
    if (prevProps.language !== language) {
      monaco.editor.setModelLanguage(model, language);
    }
    if (prevProps.theme !== theme) {
      monaco.editor.setTheme(theme);
    }
    if (editor && (width !== prevProps.width || height !== prevProps.height)) {
      editor.layout();
    }
    if (prevProps.options !== options) {
      // Don't pass in the model on update because monaco crashes if we pass the model
      // a second time. See https://github.com/microsoft/monaco-editor/issues/2027
      const { model: _model, ...optionsWithoutModel } = options;
      editor.updateOptions(optionsWithoutModel);
    }
  }

  componentWillUnmount() {
    if (this.isMonacoMounting) this.cancelable && this.cancelable.cancel();
    this.destroyMonaco();
  }

  assignRef = (component) => {
    this.containerElement = component;
  };

  destroyMonaco() {
    if (this.editor) {
      this.editor.dispose();
      const model = this.editor.getModel();
      if (model) {
        model.dispose();
      }
    }
    if (this._subscription) {
      this._subscription.dispose();
    }
  }

  initMonaco() {
    if (this.containerElement) {
      this.setState({ isFailing: false });
      this.cancelable = monaco.init();
      this.cancelable
        .then(monaco => {
          this.monaco = monaco;
          this.isMonacoMounting = false;
          const value =
            this.props.value != null ? this.props.value : this.props.defaultValue;
          const { language, theme, overrideServices } = this.props;
          const options = { ...this.props.options, ...this.editorWillMount() };
          this.editor = monaco.editor.create(
            this.containerElement,
            {
              value,
              language,
              automaticLayout: true,
              ...options,
              ...(theme ? { theme } : {}),
            },
            overrideServices
          );
          this.editorDidMount(this.editor);
          this.setState({ isEditorReady: true });
        }).catch(error => {
          if (error?.type !== 'cancelation') {
            this.errorHandler.times++;
            this.props.onInitError(error, this.errorHandler);
          }
        });
    }
  }

  editorWillMount() {
    const { editorWillMount } = this.props;
    const options = editorWillMount(this.monaco);
    return options || {};
  }

  editorDidMount(editor) {
    this.props.editorDidMount(editor, this.monaco);

    this._subscription = editor.onDidChangeModelContent((event) => {
      if (!this.__prevent_trigger_change_event) {
        this.props.onChange(editor.getValue(), event);
      }
    });
  }

  render() {
    const { width, height } = this.props;

    return (
      <MonacoContainer
        width={width}
        height={height}
        isEditorReady={this.state.isEditorReady}
        loading={this.state.isFailing ? this.props.failing : this.props.loading}
        _ref={this.assignRef}
        className={this.props.className}
        wrapperClassName={this.props.wrapperClassName}
      />
    );
  }
}

export default MonacoEditor;
