import React, { useState, useEffect } from "react";
import Popup from "./subcomponents/Popup";
import InputArea from "./subcomponents/InputArea";
interface LineData {
  address: string;
  amount: number;
}

type LineValidationError = {
  line: number;
  errors: string[];
};

const Disperse: React.FC = () => {
  const [inputData, setInputData] = useState<string>("");
  const [errors, setErrors] = useState<string[]>([]);
  const [popupOpen, setPopUpOpen] = useState<boolean>(false);
  const [hasDuplicates, setHasDuplicates] = useState<boolean>(false);
  const [triggerValidation, setTriggerValidation] = useState(false);

  useEffect(() => {
    if (triggerValidation) {
      handleKeep();
      setTriggerValidation(false); 
    }
  }, [triggerValidation]); 

  let duplicates: { [address: string]: number[] } = {};
  let parsedLines: LineData[] = [];

  const validateInput = (): LineData[] | null => {
    const lines = inputData.trim().split("\n");
    let isValid = true;
    let lineValidationErrors: LineValidationError[] = [];

    lines.forEach((line, index) => {
      const parts = line.split(/[\s=,]+/);
      if (parts.length !== 2) {
        lineValidationErrors.push({
          line: index + 1,
          errors: ["invalid format"],
        });
        isValid = false;
        return;
      }

      const [address, amountStr] = parts;
      const amount = Number(amountStr);
      let lineErrors: string[] = [];

      if (address.length !== 42 || !address.startsWith("0x")) {
        lineErrors.push("invalid Ethereum address");
        isValid = false;
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        lineErrors.push("wrong amount");
        isValid = false;
      }

      if (lineErrors.length === 0) {
        
        if (duplicates[address]) {
          duplicates[address].push(index + 1);
          //isValid = false;
          parsedLines.push({ address, amount });
        } else {
          duplicates[address] = [index + 1];
          parsedLines.push({ address, amount });
        }
      } else {
        lineValidationErrors.push({ line: index + 1, errors: lineErrors });
      }
    });

    
    let duplicateErrors: string[] = [];
    let hasDuplicatesEntries = false;
    Object.keys(duplicates).forEach((address) => {
      if (duplicates[address].length > 1) {
        hasDuplicatesEntries = true;
        duplicateErrors.push(
          `${address} duplicate in line: ${duplicates[address].join(", ")}`
        );
      }
    });
    if (hasDuplicatesEntries) {
      setHasDuplicates(true);
    } else {
      setHasDuplicates(false);
    }
    let newErrors = [
      ...duplicateErrors,
      ...lineValidationErrors.map((errorInfo) => {
        return `Line ${errorInfo.line}: ${errorInfo.errors.join(" and ")}`;
      }),
    ];

    setErrors(newErrors); 
    return isValid ? parsedLines : null;
  };

  const handleSubmit = () => {
    validateInput();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
    }
  };

  const handleInputChange = (value: string) => {
    setInputData(value);
  };

  const handleCombine = () => {
    const lines = validateInput();
    if (!lines) {
      console.error("Validation failed, cannot combine duplicates.");
      return;
    }
    const combinedAmounts: { [address: string]: number } = {};
    lines.forEach((line) => {
      if (combinedAmounts.hasOwnProperty(line.address)) {
        combinedAmounts[line.address] += line.amount;
      } else {
        combinedAmounts[line.address] = line.amount;
      }
    });

    const combinedLines: LineData[] = Object.keys(combinedAmounts).map(
      (address) => ({
        address,
        amount: combinedAmounts[address],
      })
    );
    setTriggerValidation(true);
    const updatedInputData = combinedLines
      .map((line) => `${line.address}=${line.amount}`)
      .join("\n");
    setInputData(updatedInputData);
  };

  const handleKeep = () => {
    const lines = validateInput();
    if (!lines) {
      console.error("Validation failed, cannot keep first occurrences.");
      return;
    }
    const seenAddresses = new Set<string>();
    const firstOccurrences = lines.filter((line) => {
      if (seenAddresses.has(line.address)) {
        return false;
      } else {
        seenAddresses.add(line.address);
        return true;
      }
    });
    setTriggerValidation(true);
    const updatedInputData = firstOccurrences
      .map((line) => `${line.address}=${line.amount}`)
      .join("\n");
    setInputData(updatedInputData);
  };
  return (
    <div className="flex flex-col items-center py-8">
      <div className="bg-gray-800 text-white w-full max-w-2xl rounded-lg p-6 shadow-lg">
        <div className="flex justify-between items-center pb-4">
          <h1 className="text-xl font-bold">Addresses with Amounts</h1>
          <button
            className=" text-gray-300  py-2 px-4 rounded"
            onClick={() => document.getElementById("fileUpload")?.click()}
          >
            Upload File
          </button>
          <input
            id="fileUpload"
            type="file"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
        <div className="relative">
          <InputArea
            inputValueparent={inputData}
            onInputChange={handleInputChange}
          />
        </div>
        <div className="flex justify-between items-center mt-2">
          <p className="text-gray-100">Separated by ',' or ' ' or '='</p>
          <button className="text-gray-400" onClick={() => setPopUpOpen(true)}>
            {" "}
            Show Example
          </button>
          <Popup open={popupOpen} onClose={() => setPopUpOpen(false)}>
            <div className="flex flex-col gap-30 text-black w-auto">
              <h1 className="text-2xl"> Examples </h1>
              <p>
                0x2CB99F193549681e06C6770dDD5543812B4FaFE8=1
                0x8B3392483BA26D65E331dB86D4F430E9B3814E5e 50
                0x09ae5A64465c18718a46b3aD946270BD3E5e6aaB,13
              </p>
            </div>
          </Popup>
        </div>
        {hasDuplicates && (
          <div className="bg-gray-800 text-white p-0 rounded-md mt-1">
            <div className="flex items-center justify-between mb-4 text-base">
              <h2>Duplicated</h2>
              <div className="flex">
                <button
                  className=" text-red-500 hover:text-red-200 mr-3 p-1"
                  onClick={handleKeep}
                >
                  Keep the first one
                </button>
                <div className="bg-red-500 h-3 mt-3 w-px mx-2"></div>
                <button
                  className="text-red-500 hover:text-red-200 mx-2 p-1"
                  onClick={handleCombine}
                >
                  Combine Balance
                </button>
              </div>
            </div>
          </div>
        )}

        {errors.length > 0 && (
          <div className="mt-4 border rounded border-red-600">
            <div className="flex items-center text-red-500">
              <svg
                className="fill-current h-6 w-6 text-red-600 ml-2"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M9 4h2v8H9V4zm1 12a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill="currentColor" />
                <circle
                  cx="10"
                  cy="10"
                  r="9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              <div className="px-2 py-1">
                {errors.map((error, index) => (
                  <div key={index} className="text-sm">
                    {error}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div>
          <button
            className={`w-full ml-0 mt-3 m-2 font-bold py-2 px-4 rounded-full ${
              errors.length > 0
                ? "bg-gray-400 hover:bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-500 to-violet-600 hover:bg-purple-600"
            } text-white`}
            onClick={handleSubmit}
            disabled={errors.length > 0}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Disperse;
