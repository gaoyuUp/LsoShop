"use client";
import { createContext, useContext } from "react";
import { getDictionary, type Dictionary, type Locale } from "./index";

const I18nContext = createContext<Dictionary>(getDictionary());

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <I18nContext.Provider value={getDictionary(locale)}>{children}</I18nContext.Provider>;
}

export const useT = () => useContext(I18nContext);
