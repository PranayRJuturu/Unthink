import React, { useState, useRef, useEffect } from "react";

interface InputAreaProps {
  onInputChange: (value: string) => void;
  inputValueparent: string;
}

const InputArea: React.FC<InputAreaProps> = ({
  onInputChange,
  inputValueparent,
}) => {
  const [inputValue, setInputValue] = useState<string>(inputValueparent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const linesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(inputValueparent);
  }, [inputValueparent]);
  useEffect(() => {
    const syncScroll = () => {
      if (linesRef.current && textareaRef.current) {
        linesRef.current.scrollTop = textareaRef.current.scrollTop;
      }
    };

    const textArea = textareaRef.current;
    textArea?.addEventListener("scroll", syncScroll);

    return () => {
      textArea?.removeEventListener("scroll", syncScroll);
    };
  }, []);

  const getLineNumbers = () => {
    const lines = inputValue.split("\n");
    return lines.map((_, i) => i + 1).join("\n");
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onInputChange(newValue);
  };
  return (
    <div className="flex">
      <div
        ref={linesRef}
        className="text-gray-400 select-none text-sm py-2 px-3 bg-gray-900 h-60 overflow-auto"
        style={{ fontFamily: "monospace", lineHeight: "1.5" }} 
      >
        <pre className="m-0">{getLineNumbers()}</pre>
      </div>
      <div className="bg-gray-600 w-px self-stretch" />
      <textarea
        ref={textareaRef}
        className="form-textarea border-0 text-sm w-full resize-none py-2 px-3 text-white bg-gray-900 h-60"
        style={{ fontFamily: "monospace", lineHeight: "1.5" }} 
        value={inputValue}
        onChange={handleInputChange}
        rows={10}
      />
    </div>
  );
};

export default InputArea;
