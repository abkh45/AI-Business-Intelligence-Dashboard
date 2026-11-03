import React, {
  createContext,
  useContext,
  useState,
} from "react";

const YearContext = createContext(null);

export function YearProvider({ children }) {

  const [year, setYearState] = useState(() => {

    const savedYear =
      localStorage.getItem("selectedYear");

    if (savedYear) {
      return Number(savedYear);
    }

    return 2024;
  });


  const setYear = (newYear) => {

    const numericYear = Number(newYear);

    setYearState(numericYear);

    localStorage.setItem(
      "selectedYear",
      String(numericYear)
    );
  };


  return (
    <YearContext.Provider
      value={{
        year,
        setYear,
      }}
    >
      {children}
    </YearContext.Provider>
  );
}


export function useYear() {

  const context = useContext(YearContext);

  if (!context) {
    throw new Error(
      "useYear must be used inside YearProvider"
    );
  }

  return context;
}